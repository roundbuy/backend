const { promisePool } = require('../src/config/database');

async function testStripeConnection() {
    try {
        console.log('🔍 Testing Stripe Connection...\n');

        // 1. Get Stripe secret key from database
        console.log('1️⃣ Fetching Stripe key from database...');
        const [settings] = await promisePool.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key' LIMIT 1"
        );

        if (settings.length === 0) {
            console.error('❌ Stripe secret key not found in database!');
            console.log('\n💡 Please run: node database/configure-stripe.sql');
            process.exit(1);
        }

        const secretKey = settings[0].setting_value;
        console.log(`✅ Found key: ${secretKey.substring(0, 20)}...`);

        // 2. Initialize Stripe
        console.log('\n2️⃣ Initializing Stripe...');
        const stripe = require('stripe')(secretKey);
        console.log('✅ Stripe initialized');

        // 3. Test API call - Retrieve account info
        console.log('\n3️⃣ Testing API connection...');
        const account = await stripe.accounts.retrieve();
        console.log('✅ Successfully connected to Stripe!');
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Email: ${account.email || 'Not set'}`);
        console.log(`   Country: ${account.country}`);
        console.log(`   Charges Enabled: ${account.charges_enabled}`);

        // 4. Test creating a test product
        console.log('\n4️⃣ Testing product creation...');
        const product = await stripe.products.create({
            name: 'Test Product - RoundBuy',
            description: 'Test product for Stripe integration',
            metadata: {
                test: 'true',
                created_by: 'stripe_test_script'
            }
        });
        console.log(`✅ Test product created: ${product.id}`);

        // 5. Test creating a test price
        console.log('\n5️⃣ Testing price creation...');
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 999, // $9.99
            currency: 'usd',
            metadata: {
                test: 'true'
            }
        });
        console.log(`✅ Test price created: ${price.id}`);
        console.log(`   Amount: $${price.unit_amount / 100} ${price.currency.toUpperCase()}`);

        // 6. Clean up - Archive test product
        console.log('\n6️⃣ Cleaning up test data...');
        await stripe.products.update(product.id, { active: false });
        console.log('✅ Test product archived');

        console.log('\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
        console.log('\n🎉 Your Stripe integration is working correctly!');
        console.log('📝 You can now proceed with plan synchronization.\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.type === 'StripeAuthenticationError') {
            console.error('🔑 Invalid Stripe API key. Please check your configuration.');
        } else if (error.type === 'StripeConnectionError') {
            console.error('🌐 Network error. Please check your internet connection.');
        }
        console.error('\n📋 Full error:', error);
    } finally {
        await promisePool.end();
        process.exit();
    }
}

testStripeConnection();
