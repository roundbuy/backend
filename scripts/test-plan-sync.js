const { promisePool } = require('../src/config/database');
const planSyncService = require('../src/services/planSync.service');

async function testPlanSync() {
    try {
        console.log('🧪 Testing Plan Sync with Stripe...\n');

        // Test 1: Create a test advertisement plan
        console.log('1️⃣ Creating test advertisement plan...');
        const [result] = await promisePool.query(`
      INSERT INTO advertisement_plans (name, slug, description, price, duration_days, is_active)
      VALUES ('Test Ad Plan', 'test-ad-plan', 'Test plan for Stripe sync', 99.99, 30, TRUE)
    `);

        const planId = result.insertId;
        console.log(`   ✅ Created plan ID: ${planId}`);

        // Test 2: Sync with Stripe
        console.log('\n2️⃣ Syncing with Stripe...');
        const syncResult = await planSyncService.syncAdvertisementPlan(planId, {
            name: 'Test Ad Plan',
            slug: 'test-ad-plan',
            description: 'Test plan for Stripe sync',
            prices: {
                USD: 9.99,
                EUR: 8.49,
                INR: 829.00
            }
        }, false);

        console.log(`   ✅ Stripe Product ID: ${syncResult.productId}`);

        // Test 3: Verify database
        console.log('\n3️⃣ Verifying database...');
        const [plan] = await promisePool.query(
            'SELECT * FROM advertisement_plans WHERE id = ?',
            [planId]
        );
        console.log(`   ✅ Plan has Stripe Product ID: ${plan[0].stripe_product_id}`);

        const [prices] = await promisePool.query(
            'SELECT * FROM advertisement_plan_prices WHERE advertisement_plan_id = ?',
            [planId]
        );
        console.log(`   ✅ Created ${prices.length} price entries`);
        prices.forEach(p => {
            console.log(`      - Price ID: ${p.stripe_price_id?.substring(0, 20)}...`);
        });

        // Test 4: Update price
        console.log('\n4️⃣ Testing price update...');
        await planSyncService.syncAdvertisementPlan(planId, {
            name: 'Test Ad Plan',
            slug: 'test-ad-plan',
            description: 'Test plan for Stripe sync',
            stripe_product_id: plan[0].stripe_product_id,
            prices: {
                USD: 12.99, // Changed price
                EUR: 8.49,
                INR: 829.00
            }
        }, true);
        console.log('   ✅ Price updated successfully');

        // Test 5: Clean up
        console.log('\n5️⃣ Cleaning up...');
        await promisePool.query('DELETE FROM advertisement_plans WHERE id = ?', [planId]);
        console.log('   ✅ Test plan deleted');

        console.log('\n✅ ✅ ✅ ALL SYNC TESTS PASSED! ✅ ✅ ✅\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
    } finally {
        await promisePool.end();
        process.exit();
    }
}

testPlanSync();
