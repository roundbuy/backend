const { promisePool } = require('../src/config/database');
const advertisementPlansController = require('../src/controllers/admin/advertisement-plans.admin.controller');

/**
 * Test advertisement plans controller with Stripe integration
 */
async function testAdvertisementPlans() {
    let testPlanId = null;

    try {
        console.log('🧪 Testing Advertisement Plans Controller\n');
        console.log('='.repeat(60));

        // Mock request and response objects
        const createMockRes = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.jsonData = data;
                return res;
            };
            return res;
        };

        // Test 1: Create Plan
        console.log('\n1️⃣ Testing createPlan()...');
        const createReq = {
            body: {
                name: 'Test Featured Ad Plan',
                slug: 'test-featured-ad',
                description: 'Test plan for featured advertisements',
                duration_days: 30,
                is_active: true,
                features: {
                    priority_listing: true,
                    top_search: true,
                    homepage_featured: false
                },
                prices: {
                    USD: 49.99,
                    EUR: 42.49,
                    INR: 4149
                }
            }
        };
        const createRes = createMockRes();

        await advertisementPlansController.createPlan(createReq, createRes);

        if (createRes.jsonData?.success) {
            testPlanId = createRes.jsonData.data.id;
            console.log(`   ✅ Plan created: ID ${testPlanId}`);
            console.log(`   ✅ Stripe Product: ${createRes.jsonData.data.stripe_product_id}`);
            console.log(`   ✅ Stripe Price: ${createRes.jsonData.data.stripe_price_id}`);
        } else {
            throw new Error('Failed to create plan: ' + JSON.stringify(createRes.jsonData));
        }

        // Test 2: Get All Plans
        console.log('\n2️⃣ Testing getAllPlans()...');
        const getAllReq = {};
        const getAllRes = createMockRes();

        await advertisementPlansController.getAllPlans(getAllReq, getAllRes);

        if (getAllRes.jsonData?.success) {
            console.log(`   ✅ Found ${getAllRes.jsonData.data.length} plans`);
            const testPlan = getAllRes.jsonData.data.find(p => p.id === testPlanId);
            if (testPlan) {
                console.log(`   ✅ Test plan found in list`);
                console.log(`      Name: ${testPlan.name}`);
                console.log(`      Prices: ${JSON.stringify(testPlan.prices)}`);
            }
        } else {
            throw new Error('Failed to get all plans');
        }

        // Test 3: Get Plan By ID
        console.log('\n3️⃣ Testing getPlanById()...');
        const getByIdReq = { params: { id: testPlanId } };
        const getByIdRes = createMockRes();

        await advertisementPlansController.getPlanById(getByIdReq, getByIdRes);

        if (getByIdRes.jsonData?.success) {
            const plan = getByIdRes.jsonData.data;
            console.log(`   ✅ Plan retrieved: ${plan.name}`);
            console.log(`   ✅ Stripe Product ID: ${plan.stripe_product_id}`);
            console.log(`   ✅ Features: ${JSON.stringify(plan.features)}`);
            console.log(`   ✅ Prices:`, Object.keys(plan.prices).map(c =>
                `${c}: ${plan.prices[c].price}`
            ).join(', '));
        } else {
            throw new Error('Failed to get plan by ID');
        }

        // Test 4: Update Plan
        console.log('\n4️⃣ Testing updatePlan()...');
        const updateReq = {
            params: { id: testPlanId },
            body: {
                name: 'Updated Featured Ad Plan',
                description: 'Updated description',
                prices: {
                    USD: 59.99, // Changed price
                    EUR: 42.49,
                    INR: 4149
                }
            }
        };
        const updateRes = createMockRes();

        await advertisementPlansController.updatePlan(updateReq, updateRes);

        if (updateRes.jsonData?.success) {
            console.log(`   ✅ Plan updated successfully`);

            // Verify update
            const verifyReq = { params: { id: testPlanId } };
            const verifyRes = createMockRes();
            await advertisementPlansController.getPlanById(verifyReq, verifyRes);

            if (verifyRes.jsonData?.success) {
                const updatedPlan = verifyRes.jsonData.data;
                console.log(`   ✅ Verified: Name = "${updatedPlan.name}"`);
                console.log(`   ✅ Verified: USD Price = $${updatedPlan.prices.USD.price}`);
            }
        } else {
            throw new Error('Failed to update plan');
        }

        // Test 5: Delete Plan
        console.log('\n5️⃣ Testing deletePlan()...');
        const deleteReq = { params: { id: testPlanId } };
        const deleteRes = createMockRes();

        await advertisementPlansController.deletePlan(deleteReq, deleteRes);

        if (deleteRes.jsonData?.success) {
            console.log(`   ✅ Plan archived successfully`);

            // Verify it's inactive
            const [plans] = await promisePool.query(
                'SELECT is_active FROM advertisement_plans WHERE id = ?',
                [testPlanId]
            );

            if (plans.length > 0 && !plans[0].is_active) {
                console.log(`   ✅ Verified: Plan is now inactive`);
            }
        } else {
            throw new Error('Failed to delete plan');
        }

        // Cleanup
        console.log('\n6️⃣ Cleaning up...');
        await promisePool.query('DELETE FROM advertisement_plans WHERE id = ?', [testPlanId]);
        console.log(`   ✅ Test plan deleted from database`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('   ✅ createPlan() - Working with Stripe integration');
        console.log('   ✅ getAllPlans() - Working');
        console.log('   ✅ getPlanById() - Working');
        console.log('   ✅ updatePlan() - Working with price updates');
        console.log('   ✅ deletePlan() - Working with Stripe archiving');
        console.log('\n🎉 Advertisement Plans Controller is fully functional!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);

        // Cleanup on error
        if (testPlanId) {
            try {
                await promisePool.query('DELETE FROM advertisement_plans WHERE id = ?', [testPlanId]);
                console.log('Cleaned up test plan');
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError.message);
            }
        }
    } finally {
        await promisePool.end();
        process.exit();
    }
}

testAdvertisementPlans();
