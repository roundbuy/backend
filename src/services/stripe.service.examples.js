/**
 * Stripe Service Usage Examples
 * 
 * This file demonstrates how to use the Stripe service in your controllers
 */

const stripeService = require('../services/stripe.service');

// ============================================
// Example 1: Create a Product and Price
// ============================================
async function createPlanExample() {
    try {
        // Create product
        const product = await stripeService.createProduct(
            'Gold Subscription Plan',
            'Premium features for power users',
            {
                plan_type: 'subscription',
                plan_id: '123',
                slug: 'gold-plan'
            }
        );

        // Create prices in multiple currencies
        const usdPrice = await stripeService.createPrice(
            product.id,
            9.99,
            'USD',
            'month',
            { currency: 'USD' }
        );

        const eurPrice = await stripeService.createPrice(
            product.id,
            8.49,
            'EUR',
            'month',
            { currency: 'EUR' }
        );

        const inrPrice = await stripeService.createPrice(
            product.id,
            829,
            'INR',
            'month',
            { currency: 'INR' }
        );

        console.log('Product created:', product.id);
        console.log('Prices created:', [usdPrice.id, eurPrice.id, inrPrice.id]);

        return { productId: product.id, prices: [usdPrice, eurPrice, inrPrice] };
    } catch (error) {
        console.error('Error creating plan:', error.message);
        throw error;
    }
}

// ============================================
// Example 2: Update Product Details
// ============================================
async function updatePlanExample(productId) {
    try {
        const updatedProduct = await stripeService.updateProduct(productId, {
            name: 'Gold Subscription Plan - Updated',
            description: 'Now with even more features!',
            metadata: {
                updated: 'true',
                version: '2.0'
            }
        });

        console.log('Product updated:', updatedProduct.id);
        return updatedProduct;
    } catch (error) {
        console.error('Error updating plan:', error.message);
        throw error;
    }
}

// ============================================
// Example 3: Update Price (Create New, Archive Old)
// ============================================
async function updatePriceExample(productId, oldPriceId) {
    try {
        // Archive old price
        await stripeService.archivePrice(oldPriceId);

        // Create new price
        const newPrice = await stripeService.createPrice(
            productId,
            12.99, // New price
            'USD',
            'month',
            { price_version: '2.0' }
        );

        console.log('Old price archived:', oldPriceId);
        console.log('New price created:', newPrice.id);
        return newPrice;
    } catch (error) {
        console.error('Error updating price:', error.message);
        throw error;
    }
}

// ============================================
// Example 4: Get Product and List Prices
// ============================================
async function getProductDetailsExample(productId) {
    try {
        // Get product
        const product = await stripeService.getProduct(productId);

        // List all prices
        const allPrices = await stripeService.listPrices(productId);

        // List only active prices
        const activePrices = await stripeService.listPrices(productId, true);

        console.log('Product:', product.name);
        console.log('Total prices:', allPrices.length);
        console.log('Active prices:', activePrices.length);

        return { product, allPrices, activePrices };
    } catch (error) {
        console.error('Error getting product details:', error.message);
        throw error;
    }
}

// ============================================
// Example 5: Archive Product (Soft Delete)
// ============================================
async function deletePlanExample(productId) {
    try {
        await stripeService.archiveProduct(productId);
        console.log('Product archived:', productId);
    } catch (error) {
        console.error('Error archiving product:', error.message);
        throw error;
    }
}

// ============================================
// Example 6: Create One-Time Payment Product
// ============================================
async function createAdvertisementPlanExample() {
    try {
        const product = await stripeService.createProduct(
            'Featured Ad Promotion',
            '30-day featured listing',
            {
                plan_type: 'advertisement',
                duration_days: '30'
            }
        );

        // One-time payment (not recurring)
        const price = await stripeService.createPrice(
            product.id,
            49.99,
            'USD',
            'one_time', // Important: one_time for non-recurring
            { payment_type: 'one_time' }
        );

        console.log('Advertisement plan created:', product.id);
        console.log('One-time price:', price.id);

        return { productId: product.id, priceId: price.id };
    } catch (error) {
        console.error('Error creating advertisement plan:', error.message);
        throw error;
    }
}

// ============================================
// Example 7: Using Legacy Functions
// ============================================
async function legacyExample() {
    try {
        // Old way (still works for backward compatibility)
        const productId = await stripeService.syncStripeProduct({
            name: 'My Plan',
            description: 'Plan description',
            plan_type: 'subscription',
            id: 456,
            slug: 'my-plan'
        });

        const priceId = await stripeService.createStripePrice(
            productId,
            19.99,
            'USD',
            { legacy: 'true' }
        );

        console.log('Legacy product created:', productId);
        console.log('Legacy price created:', priceId);

        return { productId, priceId };
    } catch (error) {
        console.error('Error with legacy functions:', error.message);
        throw error;
    }
}

// ============================================
// Example 8: Complete Plan Creation Workflow
// ============================================
async function completePlanWorkflow(planData) {
    try {
        console.log('Starting plan creation workflow...');

        // Step 1: Create Stripe Product
        const product = await stripeService.createProduct(
            planData.name,
            planData.description,
            {
                plan_type: planData.type,
                plan_id: planData.id.toString(),
                slug: planData.slug
            }
        );

        console.log('✅ Product created:', product.id);

        // Step 2: Create prices for each currency
        const priceIds = {};
        for (const [currency, amount] of Object.entries(planData.prices)) {
            const price = await stripeService.createPrice(
                product.id,
                amount,
                currency,
                planData.interval || 'month',
                { currency, plan_id: planData.id.toString() }
            );
            priceIds[currency] = price.id;
            console.log(`✅ Price created for ${currency}:`, price.id);
        }

        // Step 3: Save to database (your existing code)
        // await saveToDatabase(planData.id, product.id, priceIds);

        console.log('✅ Workflow complete!');

        return {
            success: true,
            productId: product.id,
            priceIds
        };
    } catch (error) {
        console.error('❌ Workflow failed:', error.message);
        throw error;
    }
}

// Example usage:
// const result = await completePlanWorkflow({
//   id: 1,
//   name: 'Premium Plan',
//   description: 'Our best plan',
//   type: 'subscription',
//   slug: 'premium',
//   interval: 'month',
//   prices: {
//     USD: 29.99,
//     EUR: 25.49,
//     INR: 2487
//   }
// });

module.exports = {
    createPlanExample,
    updatePlanExample,
    updatePriceExample,
    getProductDetailsExample,
    deletePlanExample,
    createAdvertisementPlanExample,
    legacyExample,
    completePlanWorkflow
};
