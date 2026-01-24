const { promisePool } = require('../../config/database');
const stripeService = require('../../services/stripe.service');

/**
 * Get all advertisement plans
 * GET /api/v1/admin/advertisement-plans
 */
const getAllPlans = async (req, res) => {
    try {
        const [plans] = await promisePool.query(`
      SELECT 
        ap.*,
        GROUP_CONCAT(DISTINCT CONCAT(c.code, ':', app.price) SEPARATOR ',') as currency_prices
      FROM advertisement_plans ap
      LEFT JOIN advertisement_plan_prices app ON ap.id = app.advertisement_plan_id
      LEFT JOIN currencies c ON app.currency_id = c.id
      GROUP BY ap.id
      ORDER BY ap.id DESC
    `);

        // Parse currency prices
        const plansWithPrices = plans.map(plan => {
            const prices = {};
            if (plan.currency_prices) {
                plan.currency_prices.split(',').forEach(priceStr => {
                    const [currency, price] = priceStr.split(':');
                    prices[currency] = parseFloat(price);
                });
            }

            return {
                ...plan,
                prices,
                currency_prices: undefined,
                features: plan.features ? JSON.parse(plan.features) : {},
                allowed_for_subscription_ids: plan.allowed_for_subscription_ids ?
                    JSON.parse(plan.allowed_for_subscription_ids) : []
            };
        });

        res.json({
            success: true,
            data: plansWithPrices
        });
    } catch (error) {
        console.error('Get advertisement plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching advertisement plans',
            error: error.message
        });
    }
};

/**
 * Get single advertisement plan by ID
 * GET /api/v1/admin/advertisement-plans/:id
 */
const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const [plans] = await promisePool.query(
            'SELECT * FROM advertisement_plans WHERE id = ?',
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement plan not found'
            });
        }

        const plan = plans[0];

        // Get prices for all currencies
        const [prices] = await promisePool.query(`
      SELECT app.*, c.code, c.symbol, c.name as currency_name
      FROM advertisement_plan_prices app
      JOIN currencies c ON app.currency_id = c.id
      WHERE app.advertisement_plan_id = ?
    `, [id]);

        const pricesByCurrency = {};
        prices.forEach(p => {
            pricesByCurrency[p.code] = {
                price: parseFloat(p.price),
                tax_rate: parseFloat(p.tax_rate),
                stripe_price_id: p.stripe_price_id,
                symbol: p.symbol,
                currency_name: p.currency_name
            };
        });

        res.json({
            success: true,
            data: {
                ...plan,
                features: plan.features ? JSON.parse(plan.features) : {},
                allowed_for_subscription_ids: plan.allowed_for_subscription_ids ?
                    JSON.parse(plan.allowed_for_subscription_ids) : [],
                prices: pricesByCurrency
            }
        });
    } catch (error) {
        console.error('Get advertisement plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching advertisement plan',
            error: error.message
        });
    }
};

/**
 * Create new advertisement plan with Stripe integration
 * POST /api/v1/admin/advertisement-plans
 */
const createPlan = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            duration_days,
            is_active,
            allowed_for_subscription_ids,
            features,
            prices // { USD: 9.99, EUR: 8.49, INR: 829 }
        } = req.body;

        // Validate required fields
        if (!name || !slug || !prices) {
            return res.status(400).json({
                success: false,
                message: 'Name, slug, and prices are required'
            });
        }

        // Step 1: Create Stripe Product
        console.log(`Creating Stripe Product for: ${name}`);
        const stripeProduct = await stripeService.createProduct(
            name,
            description || '',
            {
                plan_type: 'advertisement',
                slug: slug
            }
        );

        // Step 2: Get default currency
        const [defaultCurrency] = await promisePool.query(
            'SELECT id, code FROM currencies WHERE is_default = TRUE LIMIT 1'
        );

        if (defaultCurrency.length === 0) {
            throw new Error('No default currency configured');
        }

        const defaultCurrencyCode = defaultCurrency[0].code;
        const defaultPrice = prices[defaultCurrencyCode];

        if (!defaultPrice) {
            throw new Error(`Price for default currency ${defaultCurrencyCode} is required`);
        }

        // Step 3: Create Stripe Price for default currency
        const stripePrice = await stripeService.createPrice(
            stripeProduct.id,
            defaultPrice,
            defaultCurrencyCode,
            'one_time',
            { plan_slug: slug, currency: defaultCurrencyCode }
        );

        // Step 4: Insert plan into database
        const [result] = await promisePool.query(`
      INSERT INTO advertisement_plans 
      (name, slug, description, price, duration_days, is_active, 
       allowed_for_subscription_ids, features, stripe_product_id, stripe_price_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            name,
            slug,
            description || null,
            defaultPrice,
            duration_days || 30,
            is_active !== false,
            JSON.stringify(allowed_for_subscription_ids || []),
            JSON.stringify(features || {}),
            stripeProduct.id,
            stripePrice.id
        ]);

        const planId = result.insertId;

        // Step 5: Create prices for all currencies
        const [currencies] = await promisePool.query(
            'SELECT id, code FROM currencies WHERE is_active = TRUE'
        );

        for (const currency of currencies) {
            const price = prices[currency.code];
            if (price) {
                // Create Stripe Price for this currency
                const currencyStripePrice = await stripeService.createPrice(
                    stripeProduct.id,
                    price,
                    currency.code,
                    'one_time',
                    { plan_id: planId.toString(), currency: currency.code }
                );

                // Insert into database
                await promisePool.query(`
          INSERT INTO advertisement_plan_prices 
          (advertisement_plan_id, currency_id, price, tax_rate, stripe_price_id)
          VALUES (?, ?, ?, ?, ?)
        `, [planId, currency.id, price, 0, currencyStripePrice.id]);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Advertisement plan created successfully',
            data: {
                id: planId,
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id
            }
        });
    } catch (error) {
        console.error('Create advertisement plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating advertisement plan',
            error: error.message
        });
    }
};

/**
 * Update advertisement plan
 * PUT /api/v1/admin/advertisement-plans/:id
 */
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            duration_days,
            is_active,
            allowed_for_subscription_ids,
            features,
            prices
        } = req.body;

        // Get existing plan
        const [existingPlans] = await promisePool.query(
            'SELECT * FROM advertisement_plans WHERE id = ?',
            [id]
        );

        if (existingPlans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement plan not found'
            });
        }

        const existingPlan = existingPlans[0];

        // Step 1: Update Stripe Product if name or description changed
        if (existingPlan.stripe_product_id && (name || description)) {
            await stripeService.updateProduct(existingPlan.stripe_product_id, {
                name: name || existingPlan.name,
                description: description !== undefined ? description : existingPlan.description,
                metadata: {
                    plan_id: id.toString(),
                    slug: slug || existingPlan.slug
                }
            });
        }

        // Step 2: Update plan in database
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (slug) {
            updateFields.push('slug = ?');
            updateValues.push(slug);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (duration_days) {
            updateFields.push('duration_days = ?');
            updateValues.push(duration_days);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }
        if (allowed_for_subscription_ids) {
            updateFields.push('allowed_for_subscription_ids = ?');
            updateValues.push(JSON.stringify(allowed_for_subscription_ids));
        }
        if (features) {
            updateFields.push('features = ?');
            updateValues.push(JSON.stringify(features));
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await promisePool.query(
                `UPDATE advertisement_plans SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Step 3: Update prices if provided
        if (prices && existingPlan.stripe_product_id) {
            const [currencies] = await promisePool.query(
                'SELECT id, code FROM currencies WHERE is_active = TRUE'
            );

            for (const currency of currencies) {
                const newPrice = prices[currency.code];
                if (newPrice) {
                    // Get existing price
                    const [existingPrices] = await promisePool.query(`
            SELECT * FROM advertisement_plan_prices 
            WHERE advertisement_plan_id = ? AND currency_id = ?
          `, [id, currency.id]);

                    if (existingPrices.length > 0) {
                        const existingPrice = existingPrices[0];

                        // Check if price changed
                        if (parseFloat(newPrice) !== parseFloat(existingPrice.price)) {
                            // Archive old Stripe Price
                            if (existingPrice.stripe_price_id) {
                                await stripeService.archivePrice(existingPrice.stripe_price_id);
                            }

                            // Create new Stripe Price
                            const newStripePrice = await stripeService.createPrice(
                                existingPlan.stripe_product_id,
                                newPrice,
                                currency.code,
                                'one_time',
                                { plan_id: id.toString(), currency: currency.code, version: '2' }
                            );

                            // Update database
                            await promisePool.query(`
                UPDATE advertisement_plan_prices 
                SET price = ?, stripe_price_id = ? 
                WHERE id = ?
              `, [newPrice, newStripePrice.id, existingPrice.id]);

                            // Update default price if this is default currency
                            const [defaultCurrency] = await promisePool.query(
                                'SELECT code FROM currencies WHERE id = ? AND is_default = TRUE',
                                [currency.id]
                            );

                            if (defaultCurrency.length > 0) {
                                await promisePool.query(
                                    'UPDATE advertisement_plans SET price = ?, stripe_price_id = ? WHERE id = ?',
                                    [newPrice, newStripePrice.id, id]
                                );
                            }
                        }
                    } else {
                        // Create new price entry
                        const newStripePrice = await stripeService.createPrice(
                            existingPlan.stripe_product_id,
                            newPrice,
                            currency.code,
                            'one_time',
                            { plan_id: id.toString(), currency: currency.code }
                        );

                        await promisePool.query(`
              INSERT INTO advertisement_plan_prices 
              (advertisement_plan_id, currency_id, price, stripe_price_id)
              VALUES (?, ?, ?, ?)
            `, [id, currency.id, newPrice, newStripePrice.id]);
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Advertisement plan updated successfully'
        });
    } catch (error) {
        console.error('Update advertisement plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating advertisement plan',
            error: error.message
        });
    }
};

/**
 * Delete (archive) advertisement plan
 * DELETE /api/v1/admin/advertisement-plans/:id
 */
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Get plan
        const [plans] = await promisePool.query(
            'SELECT * FROM advertisement_plans WHERE id = ?',
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement plan not found'
            });
        }

        const plan = plans[0];

        // Archive Stripe Product
        if (plan.stripe_product_id) {
            await stripeService.archiveProduct(plan.stripe_product_id);
        }

        // Soft delete in database (set inactive)
        await promisePool.query(
            'UPDATE advertisement_plans SET is_active = FALSE WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Advertisement plan archived successfully'
        });
    } catch (error) {
        console.error('Delete advertisement plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting advertisement plan',
            error: error.message
        });
    }
};

module.exports = {
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
};
