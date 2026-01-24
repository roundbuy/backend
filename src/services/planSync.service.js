const { promisePool } = require('../config/database');
const stripeService = require('./stripe.service');

/**
 * Sync Subscription Plan with Stripe
 */
const syncSubscriptionPlan = async (planId, planData, isUpdate = false) => {
    try {
        const existingProductId = isUpdate ? planData.stripe_product_id : null;
        const productId = await stripeService.syncStripeProduct({
            ...planData,
            plan_type: 'subscription',
            id: planId
        }, existingProductId);

        const [currencies] = await promisePool.query(
            'SELECT id, code FROM currencies WHERE is_active = TRUE'
        );

        const [currentPrices] = await promisePool.query(
            'SELECT * FROM plan_prices WHERE subscription_plan_id = ?',
            [planId]
        );

        for (const currency of currencies) {
            const existingPrice = currentPrices.find(p => p.currency_id === currency.id);
            const newPrice = planData.prices?.[currency.code];

            if (newPrice) {
                if (existingPrice && parseFloat(newPrice) !== parseFloat(existingPrice.price)) {
                    if (existingPrice.stripe_price_id) {
                        await stripeService.deactivateStripePrice(existingPrice.stripe_price_id);
                    }

                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'UPDATE plan_prices SET price = ?, stripe_price_id = ? WHERE id = ?',
                        [newPrice, stripePriceId, existingPrice.id]
                    );
                } else if (!existingPrice) {
                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'INSERT INTO plan_prices (subscription_plan_id, currency_id, price, stripe_price_id) VALUES (?, ?, ?, ?)',
                        [planId, currency.id, newPrice, stripePriceId]
                    );
                }
            }
        }

        await promisePool.query(
            'UPDATE subscription_plans SET stripe_product_id = ? WHERE id = ?',
            [productId, planId]
        );

        return { success: true, productId };
    } catch (error) {
        console.error('Error syncing subscription plan:', error);
        throw error;
    }
};

/**
 * Sync Advertisement Plan with Stripe
 */
const syncAdvertisementPlan = async (planId, planData, isUpdate = false) => {
    try {
        const existingProductId = isUpdate ? planData.stripe_product_id : null;
        const productId = await stripeService.syncStripeProduct({
            ...planData,
            plan_type: 'advertisement',
            id: planId
        }, existingProductId);

        const [currencies] = await promisePool.query(
            'SELECT id, code FROM currencies WHERE is_active = TRUE'
        );

        const [currentPrices] = await promisePool.query(
            'SELECT * FROM advertisement_plan_prices WHERE advertisement_plan_id = ?',
            [planId]
        );

        for (const currency of currencies) {
            const existingPrice = currentPrices.find(p => p.currency_id === currency.id);
            const newPrice = planData.prices?.[currency.code];

            if (newPrice) {
                if (existingPrice && parseFloat(newPrice) !== parseFloat(existingPrice.price)) {
                    if (existingPrice.stripe_price_id) {
                        await stripeService.deactivateStripePrice(existingPrice.stripe_price_id);
                    }

                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'UPDATE advertisement_plan_prices SET price = ?, stripe_price_id = ? WHERE id = ?',
                        [newPrice, stripePriceId, existingPrice.id]
                    );
                } else if (!existingPrice) {
                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'INSERT INTO advertisement_plan_prices (advertisement_plan_id, currency_id, price, stripe_price_id) VALUES (?, ?, ?, ?)',
                        [planId, currency.id, newPrice, stripePriceId]
                    );
                }
            }
        }

        await promisePool.query(
            'UPDATE advertisement_plans SET stripe_product_id = ? WHERE id = ?',
            [productId, planId]
        );

        return { success: true, productId };
    } catch (error) {
        console.error('Error syncing advertisement plan:', error);
        throw error;
    }
};

/**
 * Sync Banner Plan with Stripe
 */
const syncBannerPlan = async (planId, planData, isUpdate = false) => {
    try {
        const existingProductId = isUpdate ? planData.stripe_product_id : null;
        const productId = await stripeService.syncStripeProduct({
            ...planData,
            plan_type: 'banner',
            id: planId
        }, existingProductId);

        const [currencies] = await promisePool.query(
            'SELECT id, code FROM currencies WHERE is_active = TRUE'
        );

        const [currentPrices] = await promisePool.query(
            'SELECT * FROM banner_plan_prices WHERE banner_plan_id = ?',
            [planId]
        );

        for (const currency of currencies) {
            const existingPrice = currentPrices.find(p => p.currency_id === currency.id);
            const newPrice = planData.prices?.[currency.code];

            if (newPrice) {
                if (existingPrice && parseFloat(newPrice) !== parseFloat(existingPrice.price)) {
                    if (existingPrice.stripe_price_id) {
                        await stripeService.deactivateStripePrice(existingPrice.stripe_price_id);
                    }

                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'UPDATE banner_plan_prices SET price = ?, stripe_price_id = ? WHERE id = ?',
                        [newPrice, stripePriceId, existingPrice.id]
                    );
                } else if (!existingPrice) {
                    const stripePriceId = await stripeService.createStripePrice(
                        productId, newPrice, currency.code,
                        { plan_id: planId.toString(), currency: currency.code }
                    );

                    await promisePool.query(
                        'INSERT INTO banner_plan_prices (banner_plan_id, currency_id, price, stripe_price_id) VALUES (?, ?, ?, ?)',
                        [planId, currency.id, newPrice, stripePriceId]
                    );
                }
            }
        }

        await promisePool.query(
            'UPDATE banner_plans SET stripe_product_id = ? WHERE id = ?',
            [productId, planId]
        );

        return { success: true, productId };
    } catch (error) {
        console.error('Error syncing banner plan:', error);
        throw error;
    }
};

module.exports = {
    syncSubscriptionPlan,
    syncAdvertisementPlan,
    syncBannerPlan
};
