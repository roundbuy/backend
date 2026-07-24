const { promisePool } = require('../../config/database');

exports.getCheckoutConfig = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Wallet Balance
        const [walletResult] = await promisePool.query(
            `SELECT COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) - 
                     SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0) as balance 
             FROM wallet_transactions 
             WHERE user_id = ? AND status = 'completed'`,
            [userId]
        );
        const walletBalance = walletResult[0].balance || 0;

        // 2. Get User Contact / Address Details
        const [userResult] = await promisePool.query(
            "SELECT full_name, phone, billing_address FROM users WHERE id = ?",
            [userId]
        );
        const user = userResult[0];

        // Ensure we gracefully handle missing address
        let savedAddress = null;
        if (user.billing_address) {
            try {
                savedAddress = JSON.parse(user.billing_address);
            } catch (e) {
                savedAddress = null;
            }
        }

        // Always pass down name and phone
        savedAddress = {
            ...savedAddress,
            fullName: user.full_name,
            phone: user.phone || ''
        };

        // 3. Get Saved Payment Methods
        const [paymentMethods] = await promisePool.query(
            "SELECT * FROM saved_payment_methods WHERE user_id = ? AND is_active = TRUE",
            [userId]
        );

        // 4. Get System Fees Setup (Fallback to defaults if not found)
        const [settings] = await promisePool.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('buyer_fee', 'item_value_fee_percent', 'stripe_publishable_key')"
        );

        let buyerFeeStr = '1.00';
        let itemValueFeeStr = '2.7';
        let stripePublishableKey = null;

        settings.forEach(s => {
            if (s.setting_key === 'buyer_fee') buyerFeeStr = s.setting_value;
            if (s.setting_key === 'item_value_fee_percent') itemValueFeeStr = s.setting_value;
            if (s.setting_key === 'stripe_publishable_key') stripePublishableKey = s.setting_value;
        });

        // Fallback to a dummy key if completely missing so the frontend doesn't break
        if (!stripePublishableKey) {
            stripePublishableKey = 'pk_test_dummy_key_requires_real_key_in_settings';
        }

        res.json({
            success: true,
            data: {
                walletBalance: parseFloat(walletBalance),
                fees: {
                    buyerFee: parseFloat(buyerFeeStr),
                    itemValueFeePercent: parseFloat(itemValueFeeStr)
                },
                savedAddress,
                savedPaymentMethods: paymentMethods,
                stripePublishableKey
            }
        });
    } catch (error) {
        console.error('Error fetching checkout config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.saveAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phone, addressLine1, addressLine2, postcode, city, country } = req.body;

        const addressObj = { addressLine1, addressLine2, postcode, city, country };

        // Update name, phone, and billing_address
        await promisePool.query(
            "UPDATE users SET full_name = ?, phone = ?, billing_address = ? WHERE id = ?",
            [fullName, phone, JSON.stringify(addressObj), userId]
        );

        res.json({ success: true, message: 'Address saved successfully' });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'GBP' } = req.body;

        // Fetch Stripe Secret Key from database
        const [settings] = await promisePool.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key'"
        );

        let stripeSecretKey = settings[0]?.setting_value;

        // Fallback to a dummy key if completely missing so the backend intent creation doesn't crash 400
        if (!stripeSecretKey) {
            console.warn('WARNING: Stripe Secret Key not found in DB. Falling back to a dummy key.');
            stripeSecretKey = 'sk_test_dummy_key_from_backend_fallback';
        }

        const stripe = require('stripe')(stripeSecretKey);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amounts in cents/pence
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
            }
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.processOrder = async (req, res) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id;
        const { advertisementId, conversationId, deliveryOption, paymentMethod, amount, paymentId, addressDetails } = req.body;

        let sellerId;
        let adTitle;
        let finalAdvertisementId = advertisementId;

        if (conversationId && typeof conversationId === 'string' && conversationId.startsWith('event-')) {
            const eventItemId = conversationId.split('-')[1];
            const [eventItems] = await connection.query(
                "SELECT uploaded_by, title, advertisement_id FROM event_items WHERE id = ?",
                [eventItemId]
            );
            if (!eventItems.length) throw new Error('Event item not found');
            
            sellerId = eventItems[0].uploaded_by;
            adTitle = eventItems[0].title;
            finalAdvertisementId = eventItems[0].advertisement_id || null;

            // Update purchase_completed = 1 and status = 'sold' in event_items for that item ID
            await connection.query(
                "UPDATE event_items SET purchase_completed = 1, status = 'sold' WHERE id = ?",
                [eventItemId]
            );
            
            // If linked to an advertisement, mark that advertisement as sold as well
            if (finalAdvertisementId) {
                await connection.query(
                    "UPDATE advertisements SET status = 'sold' WHERE id = ?",
                    [finalAdvertisementId]
                );
            }
        } else {
            // Fetch Advertisement to link seller
            const [ad] = await connection.query("SELECT user_id, title FROM advertisements WHERE id = ?", [advertisementId]);
            if (!ad.length) throw new Error('Advertisement not found');
            sellerId = ad[0].user_id;
            adTitle = ad[0].title;
        }

        // 1. Handle Wallet Payment
        if (paymentMethod === 'wallet') {
            // Fetch wallet and lock it for update
            const [wallets] = await connection.query(
                'SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE',
                [userId]
            );
            if (!wallets.length) {
                throw new Error('User wallet not found');
            }
            const wallet = wallets[0];
            const balance = parseFloat(wallet.balance || 0);

            if (balance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            const balanceAfter = balance - amount;

            // Update wallet balance
            await connection.query(
                'UPDATE user_wallets SET balance = ? WHERE id = ?',
                [balanceAfter, wallet.id]
            );

            // Deduct Wallet (create transaction record)
            await connection.query(
                `INSERT INTO wallet_transactions 
                 (wallet_id, user_id, transaction_type, amount, balance_before, balance_after, category, status, description)
                 VALUES (?, ?, 'debit', ?, ?, ?, 'payment', 'completed', ?)`,
                [wallet.id, userId, amount, balance, balanceAfter, 'Payment for Order: ' + adTitle]
            );
        }

        // 2. Create the Order Record (saving deliveryOption in notes or explicitly if column exists) 
        // We'll safely pack delivery details into shipping_address/notes since schema might lack 'delivery_option'
        const addressJson = addressDetails ? JSON.stringify(addressDetails) : null;
        const notes = JSON.stringify({ deliveryOption: deliveryOption });

        const [orderResult] = await connection.query(
            `INSERT INTO orders 
             (buyer_id, seller_id, advertisement_id, amount, status, payment_status, payment_method, payment_id, shipping_address, notes) 
             VALUES (?, ?, ?, ?, 'confirmed', 'completed', ?, ?, ?, ?)`,
            [userId, sellerId, finalAdvertisementId, amount, paymentMethod, paymentId || null, addressJson, notes]
        );
        const orderId = orderResult.insertId;

        // 3. Create Order Item
        await connection.query(
            "INSERT INTO order_items (order_id, advertisement_id, quantity, price) VALUES (?, ?, 1, ?)",
            [orderId, finalAdvertisementId, amount]
        );

        // 4. If part of a conversation flow, update that conversation step 
        // (This would hypothetically mark step 3 complete depending on the exact schema)

        await connection.commit();

        // --- KYC GATE: Update seller's cumulative earnings after successful order ---
        try {
            // Increment seller's cumulative_earnings
            await promisePool.query(
                `UPDATE users 
                 SET cumulative_earnings = cumulative_earnings + ?
                 WHERE id = ?`,
                [amount, sellerId]
            );

            // Check if seller has crossed the £1000 threshold
            const [sellerKyc] = await promisePool.query(
                `SELECT cumulative_earnings, kyc_required, kyc_completed FROM users WHERE id = ?`,
                [sellerId]
            );

            if (sellerKyc.length > 0) {
                const { cumulative_earnings, kyc_required, kyc_completed } = sellerKyc[0];
                if (cumulative_earnings >= 1000 && !kyc_required && !kyc_completed) {
                    await promisePool.query(
                        `UPDATE users SET kyc_required = 1 WHERE id = ?`,
                        [sellerId]
                    );
                    console.log(`[KYC GATE] Seller ${sellerId} crossed £1000 threshold. KYC required flag set.`);
                }
            }
        } catch (kycErr) {
            // Non-blocking: don't fail the order if KYC update fails
            console.error('[KYC GATE] Failed to update earnings/KYC flag:', kycErr.message);
        }

        res.json({ success: true, message: 'Order processed successfully', orderId });
    } catch (error) {
        await connection.rollback();
        console.error('Error processing order:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};
