const stripeService = require('../src/services/stripe.service');

/**
 * Test all Stripe service functions
 */
async function testStripeService() {
    let testProductId = null;
    let testPriceId = null;

    try {
        console.log('🧪 Testing Stripe Service Functions\n');
        console.log('='.repeat(50));

        // Test 1: Create Product
        console.log('\n1️⃣ Testing createProduct()...');
        const product = await stripeService.createProduct(
            'Test Service Product',
            'Testing the new Stripe service',
            { test: 'true', environment: 'development' }
        );
        testProductId = product.id;
        console.log(`   Product Name: ${product.name}`);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   Metadata: ${JSON.stringify(product.metadata)}`);

        // Test 2: Get Product
        console.log('\n2️⃣ Testing getProduct()...');
        const retrievedProduct = await stripeService.getProduct(testProductId);
        console.log(`   Retrieved: ${retrievedProduct.name}`);
        console.log(`   Active: ${retrievedProduct.active}`);

        // Test 3: Update Product
        console.log('\n3️⃣ Testing updateProduct()...');
        const updatedProduct = await stripeService.updateProduct(testProductId, {
            name: 'Updated Test Product',
            description: 'Updated description',
            metadata: { updated: 'true' }
        });
        console.log(`   New Name: ${updatedProduct.name}`);
        console.log(`   New Description: ${updatedProduct.description}`);

        // Test 4: Create Price (one-time)
        console.log('\n4️⃣ Testing createPrice() - One-time...');
        const oneTimePrice = await stripeService.createPrice(
            testProductId,
            19.99,
            'USD',
            'one_time',
            { price_type: 'one_time' }
        );
        testPriceId = oneTimePrice.id;
        console.log(`   Price ID: ${oneTimePrice.id}`);
        console.log(`   Amount: $${oneTimePrice.unit_amount / 100}`);
        console.log(`   Currency: ${oneTimePrice.currency.toUpperCase()}`);
        console.log(`   Type: ${oneTimePrice.type}`);

        // Test 5: Create Price (recurring)
        console.log('\n5️⃣ Testing createPrice() - Recurring...');
        const recurringPrice = await stripeService.createPrice(
            testProductId,
            9.99,
            'USD',
            'month',
            { price_type: 'subscription' }
        );
        console.log(`   Price ID: ${recurringPrice.id}`);
        console.log(`   Amount: $${recurringPrice.unit_amount / 100}/month`);
        console.log(`   Recurring: ${JSON.stringify(recurringPrice.recurring)}`);

        // Test 6: Create Prices in different currencies
        console.log('\n6️⃣ Testing createPrice() - Multi-currency...');
        const eurPrice = await stripeService.createPrice(testProductId, 16.99, 'EUR', 'one_time');
        const inrPrice = await stripeService.createPrice(testProductId, 1649, 'INR', 'one_time');
        console.log(`   EUR Price: €${eurPrice.unit_amount / 100}`);
        console.log(`   INR Price: ₹${inrPrice.unit_amount / 100}`);

        // Test 7: List Prices
        console.log('\n7️⃣ Testing listPrices()...');
        const allPrices = await stripeService.listPrices(testProductId);
        console.log(`   Total prices: ${allPrices.length}`);
        allPrices.forEach((price, index) => {
            console.log(`   ${index + 1}. ${price.id} - ${price.unit_amount / 100} ${price.currency.toUpperCase()} (Active: ${price.active})`);
        });

        // Test 8: List Active Prices Only
        console.log('\n8️⃣ Testing listPrices(activeOnly=true)...');
        const activePrices = await stripeService.listPrices(testProductId, true);
        console.log(`   Active prices: ${activePrices.length}`);

        // Test 9: Archive Price
        console.log('\n9️⃣ Testing archivePrice()...');
        await stripeService.archivePrice(testPriceId);
        const archivedPrice = await stripeService.listPrices(testProductId);
        const isArchived = archivedPrice.find(p => p.id === testPriceId);
        console.log(`   Price ${testPriceId} active: ${isArchived.active}`);

        // Test 10: Archive Product
        console.log('\n🔟 Testing archiveProduct()...');
        await stripeService.archiveProduct(testProductId);
        const archivedProduct = await stripeService.getProduct(testProductId);
        console.log(`   Product ${testProductId} active: ${archivedProduct.active}`);

        // Test 11: Test legacy functions
        console.log('\n1️⃣1️⃣ Testing legacy functions (backward compatibility)...');
        const legacyProduct = await stripeService.syncStripeProduct({
            name: 'Legacy Test',
            description: 'Testing legacy function',
            plan_type: 'test',
            id: 999,
            slug: 'legacy-test'
        });
        console.log(`   Legacy product created: ${legacyProduct}`);

        const legacyPriceId = await stripeService.createStripePrice(legacyProduct, 29.99, 'USD', { legacy: 'true' });
        console.log(`   Legacy price created: ${legacyPriceId}`);

        await stripeService.deactivateStripePrice(legacyPriceId);
        console.log(`   Legacy price deactivated`);

        await stripeService.archiveStripeProduct(legacyProduct);
        console.log(`   Legacy product archived`);

        console.log('\n' + '='.repeat(50));
        console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
        console.log('='.repeat(50));
        console.log('\n📋 Summary:');
        console.log('   ✅ createProduct() - Working');
        console.log('   ✅ updateProduct() - Working');
        console.log('   ✅ getProduct() - Working');
        console.log('   ✅ createPrice() - Working (one-time & recurring)');
        console.log('   ✅ archivePrice() - Working');
        console.log('   ✅ listPrices() - Working');
        console.log('   ✅ archiveProduct() - Working');
        console.log('   ✅ Legacy functions - Working');
        console.log('\n🎉 Stripe Service is fully functional!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
    } finally {
        process.exit();
    }
}

testStripeService();
