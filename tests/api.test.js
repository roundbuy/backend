const request = require('supertest');
const assert = require('assert');
const app = require('../src/app');
const { promisePool } = require('../src/config/database');

describe('RoundBuy API End-to-End Integration Tests', () => {
    let testUserToken = '';
    let testUserId = null;
    const testEmail = `testuser_${Math.floor(Math.random() * 1000000)}@example.com`;
    const testPassword = 'Password123!';
    const testFullName = 'Test User';
    
    // We will find or create a mock product to test offers on
    let testProductId = null;
    let otherSellerId = null;

    before(async () => {
        // Create another user to own the advertisement (so our test user can bid on it)
        const otherEmail = `seller_${Math.floor(Math.random() * 1000000)}@example.com`;
        const [sellerResult] = await promisePool.execute(
            `INSERT INTO users (email, password_hash, full_name, is_verified) 
             VALUES (?, 'hashed', 'Test Seller', TRUE)`,
            [otherEmail]
        );
        otherSellerId = sellerResult.insertId;

        // Insert a mock advertisement for offer testing
        const [adResult] = await promisePool.execute(
            `INSERT INTO advertisements (user_id, title, description, price, category_id, status)
             VALUES (?, 'Mocha Test Item', 'A description', 100.00, 1, 'published')`,
            [otherSellerId]
        );
        testProductId = adResult.insertId;
    });

    after(async () => {
        // Clean up test data
        if (testUserId) {
            await promisePool.execute('DELETE FROM offers WHERE buyer_id = ?', [testUserId]);
            await promisePool.execute('DELETE FROM postage_shipments WHERE user_id = ?', [testUserId]);
            await promisePool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
        }
        if (otherSellerId) {
            await promisePool.execute('DELETE FROM advertisements WHERE user_id = ?', [otherSellerId]);
            await promisePool.execute('DELETE FROM users WHERE id = ?', [otherSellerId]);
        }
    });

    // 1. PUBLIC ENDPOINTS
    describe('Public Endpoints', () => {
        it('should get server health status', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);

            assert.strictEqual(res.body.status, 'OK');
        });

        it('should auto-detect country by IP', async () => {
            const res = await request(app)
                .get('/api/v1/mobile-app/user/detect-country')
                .expect(200);

            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.data.country_code);
        });
    });

    // 2. AUTHENTICATION FLOW
    describe('Authentication Flow', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/v1/mobile-app/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    full_name: testFullName
                })
                .expect(201);

            assert.strictEqual(res.body.success, true);
            testUserId = res.body.data.user.id;

            // Make the user verified directly in database so we can log in
            await promisePool.execute(
                'UPDATE users SET is_verified = TRUE WHERE id = ?',
                [testUserId]
            );
        });

        it('should fail to log in with incorrect credentials', async () => {
            await request(app)
                .post('/api/v1/mobile-app/auth/login')
                .send({
                    email: testEmail,
                    password: 'WrongPassword'
                })
                .expect(401);
        });

        it('should log in successfully and return a JWT access token', async () => {
            const res = await request(app)
                .post('/api/v1/mobile-app/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                })
                .expect(200);

            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.data.access_token);
            testUserToken = res.body.data.access_token;
        });
    });

    // 3. KYC VERIFICATION FLOW
    describe('KYC Verification Flow', () => {
        it('should get the initial KYC status (unverified)', async () => {
            const res = await request(app)
                .get('/api/v1/mobile-app/kyc/status')
                .set('Authorization', `Bearer ${testUserToken}`)
                .expect(200);

            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.data.status, 'unverified');
        });

        it('should submit a KYC verification request', async () => {
            const res = await request(app)
                .post('/api/v1/mobile-app/kyc/submit')
                .set('Authorization', `Bearer ${testUserToken}`)
                .field('country_code', 'GB')
                .field('document_type', 'Passport')
                .attach('front_document', Buffer.from('dummy file content'), 'passport.png')
                .expect(200);

            assert.strictEqual(res.body.success, true);
            // Verify DB status directly
            const [rows] = await promisePool.execute('SELECT status FROM kyc_records WHERE user_id = ?', [testUserId]);
            assert.strictEqual(rows[0].status, 'pending');
        });
    });

    // 4. OFFERS AND BIDS SYSTEM
    describe('Offers and Bids System (60% Rule)', () => {
        it('should reject a bid lower than 60% of the asking price', async () => {
            // Price is 100.00, 60% is 60.00. Bid 50.00 should be rejected.
            const res = await request(app)
                .post('/api/v1/mobile-app/offers')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    advertisementId: testProductId,
                    price: 50.00,
                    message: 'Low bid'
                })
                .expect(400);

            assert.strictEqual(res.body.success, false);
            assert.strictEqual(res.body.error_code, 'OFFER_BELOW_MINIMUM');
        });

        it('should accept a bid equal to or higher than 60% of the asking price', async () => {
            const res = await request(app)
                .post('/api/v1/mobile-app/offers')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    advertisementId: testProductId,
                    price: 75.00,
                    message: 'Good bid'
                })
                .expect(201);

            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.offer_id);
        });
    });

    // 5. POSTAGE SYSTEM
    describe('Postage System', () => {
        let selectedCarrierId = null;
        let selectedRateId = null;

        it('should fetch available shipping carriers', async () => {
            const res = await request(app)
                .get('/api/v1/mobile-app/postage/carriers')
                .set('Authorization', `Bearer ${testUserToken}`)
                .expect(200);

            assert.strictEqual(res.body.success, true);
            assert.ok(Array.isArray(res.body.data));
            if (res.body.data.length > 0) {
                selectedCarrierId = res.body.data[0].id;
            }
        });

        it('should calculate shipping rates', async () => {
            if (!selectedCarrierId) return;

            const res = await request(app)
                .post('/api/v1/mobile-app/postage/calculate')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    carrier_id: selectedCarrierId,
                    origin_country: 'GB',
                    destination_country: 'GB',
                    weight_kg: 1.5
                })
                .expect(200);

            assert.strictEqual(res.body.success, true);
            if (res.body.data) {
                selectedRateId = res.body.data.id;
            }
        });

        it('should create a postage shipment and generate label + QR code', async () => {
            if (!selectedCarrierId || !selectedRateId) return;

            const res = await request(app)
                .post('/api/v1/mobile-app/postage/shipments')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    carrier_id: selectedCarrierId,
                    rate_id: selectedRateId,
                    weight_kg: 1.5,
                    estimated_cost: 5.50,
                    currency_code: 'GBP',
                    sender_name: 'Jane Doe',
                    sender_address_line1: '10 Senders St',
                    sender_city: 'London',
                    sender_postcode: 'EC1A 1BB',
                    sender_country: 'United Kingdom',
                    sender_country_code: 'GB',
                    receiver_name: 'John Smith',
                    receiver_address_line1: '20 Receivers Rd',
                    receiver_city: 'Manchester',
                    receiver_postcode: 'M1 1AA',
                    receiver_country: 'United Kingdom',
                    receiver_country_code: 'GB',
                    length_cm: 20,
                    width_cm: 15,
                    height_cm: 10,
                    package_description: 'Books'
                })
                .expect(200);

            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.data.tracking_number);
            assert.ok(res.body.data.qr_code_data);
            assert.ok(res.body.data.label_url);
        });
    });
});
