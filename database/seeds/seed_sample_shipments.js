/**
 * Seed Sample Shipments for Admin Panel
 * Run: node backend/database/seeds/seed_sample_shipments.js
 */
const { promisePool } = require('../../src/config/database');

async function seed() {
    try {
        console.log('🔗 Connecting to the database...');
        
        // 1. Fetch carriers
        const [carriers] = await promisePool.query('SELECT id, name, code FROM shipping_carriers');
        if (carriers.length === 0) {
            console.error('❌ No carriers found. Please run the postage system seed first: node backend/database/seeds/seed_postage_system.js');
            process.exit(1);
        }
        console.log(`✓ Found ${carriers.length} shipping carriers.`);

        // 2. Fetch users
        const [users] = await promisePool.query('SELECT id, email, full_name FROM users LIMIT 5');
        if (users.length === 0) {
            console.error('❌ No users found in the database. Please register or seed users first.');
            process.exit(1);
        }
        console.log(`✓ Found ${users.length} users to assign shipments to.`);

        const carrierMap = {};
        carriers.forEach(c => {
            carrierMap[c.code] = c.id;
        });

        // Predefined mock shipments matching actual DESCRIBE postage_shipments columns
        const mockShipments = [
            {
                user_id: users[0].id,
                carrier_code: 'royal_mail',
                tracking_number: 'RM123456789GB',
                sender_name: 'John Doe',
                sender_address_line1: '12 Baker St',
                sender_city: 'London',
                sender_postcode: 'NW1 6XE',
                sender_country: 'United Kingdom',
                sender_country_code: 'GB',
                receiver_name: 'Alice Smith',
                receiver_address_line1: '45 High St',
                receiver_city: 'Manchester',
                receiver_postcode: 'M1 1AD',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 1.250,
                length_cm: 20.00,
                width_cm: 15.00,
                height_cm: 10.00,
                estimated_cost: 3.99,
                status: 'created',
                notes: 'Fragile: handle with care.'
            },
            {
                user_id: users[0].id,
                carrier_code: 'evri',
                tracking_number: 'EVRI987654321',
                sender_name: 'Sarah Connor',
                sender_address_line1: '78 Skyline Dr',
                sender_city: 'Birmingham',
                sender_postcode: 'B1 1AY',
                sender_country: 'United Kingdom',
                sender_country_code: 'GB',
                receiver_name: 'John Connor',
                receiver_address_line1: '102 Tech Way',
                receiver_city: 'London',
                receiver_postcode: 'EC1A 1BB',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 0.500,
                length_cm: 15.00,
                width_cm: 10.00,
                height_cm: 5.00,
                estimated_cost: 2.99,
                status: 'label_generated',
                notes: 'Leave in safe place if not home.'
            },
            {
                user_id: users[1] ? users[1].id : users[0].id,
                carrier_code: 'dpd_uk',
                tracking_number: 'DPD748392019',
                sender_name: 'David Beckham',
                sender_address_line1: '22 Trafford Rd',
                sender_city: 'Manchester',
                sender_postcode: 'M16 0RA',
                sender_country: 'United Kingdom',
                sender_country_code: 'GB',
                receiver_name: 'Victoria Adams',
                receiver_address_line1: '5 Fashion Row',
                receiver_city: 'London',
                receiver_postcode: 'W1K 2HN',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 4.800,
                length_cm: 30.00,
                width_cm: 25.00,
                height_cm: 20.00,
                estimated_cost: 8.99,
                status: 'collected',
                notes: 'Signature required on delivery.'
            },
            {
                user_id: users[2] ? users[2].id : users[0].id,
                carrier_code: 'dhl_express',
                tracking_number: 'DHL5647382910',
                sender_name: 'Shinji Kagawa',
                sender_address_line1: '1-2-3 Shibuya',
                sender_city: 'Tokyo',
                sender_postcode: '150-0002',
                sender_country: 'Japan',
                sender_country_code: 'JP',
                receiver_name: 'Marcus Rashford',
                receiver_address_line1: '12 Carrington Lane',
                receiver_city: 'Manchester',
                receiver_postcode: 'M31 4BH',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 2.100,
                length_cm: 25.00,
                width_cm: 20.00,
                height_cm: 15.00,
                estimated_cost: 14.99,
                status: 'in_transit',
                notes: 'Express worldwide service.'
            },
            {
                user_id: users[0].id,
                carrier_code: 'royal_mail',
                tracking_number: 'RM776655443GB',
                sender_name: 'Emma Watson',
                sender_address_line1: '45 Oxford St',
                sender_city: 'Oxford',
                sender_postcode: 'OX1 3BH',
                sender_country: 'United Kingdom',
                sender_country_code: 'GB',
                receiver_name: 'Rupert Grint',
                receiver_address_line1: '99 Hogsmeade Rd',
                receiver_city: 'Edinburgh',
                receiver_postcode: 'EH1 1YZ',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 0.850,
                length_cm: 18.00,
                width_cm: 12.00,
                height_cm: 8.00,
                estimated_cost: 3.49,
                status: 'out_for_delivery',
                notes: 'Deliver to front porch.'
            },
            {
                user_id: users[1] ? users[1].id : users[0].id,
                carrier_code: 'ups',
                tracking_number: 'UPS1Z999AA12345674',
                sender_name: 'Bill Gates',
                sender_address_line1: '1 Microsoft Way',
                sender_city: 'Redmond',
                sender_postcode: '98052',
                sender_country: 'United States',
                sender_country_code: 'US',
                receiver_name: 'Steve Jobs',
                receiver_address_line1: 'Infinity Loop',
                receiver_city: 'Cupertino',
                receiver_postcode: '95014',
                receiver_country: 'United States',
                receiver_country_code: 'US',
                weight_kg: 5.500,
                length_cm: 35.00,
                width_cm: 30.00,
                height_cm: 25.00,
                estimated_cost: 22.99,
                status: 'delivered',
                notes: 'Left with receptionist.'
            },
            {
                user_id: users[0].id,
                carrier_code: 'evri',
                tracking_number: 'EVRI112233445',
                sender_name: 'Jane Austin',
                sender_address_line1: '14 Bath Rd',
                sender_city: 'Bath',
                sender_postcode: 'BA1 1EE',
                sender_country: 'United Kingdom',
                sender_country_code: 'GB',
                receiver_name: 'Charles Dickens',
                receiver_address_line1: '48 Kent St',
                receiver_city: 'Rochester',
                receiver_postcode: 'ME1 1XX',
                receiver_country: 'United Kingdom',
                receiver_country_code: 'GB',
                weight_kg: 1.100,
                length_cm: 22.00,
                width_cm: 16.00,
                height_cm: 12.00,
                estimated_cost: 2.99,
                status: 'cancelled',
                notes: 'Cancelled by sender.'
            }
        ];

        console.log('📦 Seeding sample shipments into database...');
        let seededCount = 0;

        for (const s of mockShipments) {
            const carrierId = carrierMap[s.carrier_code];
            if (!carrierId) {
                console.warn(`⚠️ Carrier ${s.carrier_code} not active in database. Skipping.`);
                continue;
            }

            // Check if tracking number already exists to avoid unique constraint violations
            const [exist] = await promisePool.query('SELECT id FROM postage_shipments WHERE tracking_number = ?', [s.tracking_number]);
            if (exist.length > 0) {
                console.log(`↩ Shipment ${s.tracking_number} already exists. Skipping.`);
                continue;
            }

            const labelUrl = `/shipping/labels/label_${s.tracking_number}.pdf`;
            const qrCodeUrl = `http://localhost:5001/shipping/qr/qr_${s.tracking_number}.png`;
            const qrCodeData = `BASE64_QR_CODE_MOCK_DATA_FOR_${s.tracking_number}`;

            await promisePool.query(
                `INSERT INTO postage_shipments 
                (user_id, carrier_id, tracking_number, 
                 sender_name, sender_address_line1, sender_city, sender_postcode, sender_country, sender_country_code,
                 receiver_name, receiver_address_line1, receiver_city, receiver_postcode, receiver_country, receiver_country_code,
                 weight_kg, length_cm, width_cm, height_cm, estimated_cost, currency_code, status, label_url, qr_code_url, qr_code_data, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GBP', ?, ?, ?, ?, ?)`,
                [
                    s.user_id,
                    carrierId,
                    s.tracking_number,
                    s.sender_name,
                    s.sender_address_line1,
                    s.sender_city,
                    s.sender_postcode,
                    s.sender_country,
                    s.sender_country_code,
                    s.receiver_name,
                    s.receiver_address_line1,
                    s.receiver_city,
                    s.receiver_postcode,
                    s.receiver_country,
                    s.receiver_country_code,
                    s.weight_kg,
                    s.length_cm,
                    s.width_cm,
                    s.height_cm,
                    s.estimated_cost,
                    s.status,
                    labelUrl,
                    qrCodeUrl,
                    qrCodeData,
                    s.notes
                ]
            );
            seededCount++;
            console.log(`✓ Seeded shipment ${s.tracking_number} with status: ${s.status}`);
        }

        console.log(`\n🎉 Done! Seeded ${seededCount} new sample shipments successfully.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
