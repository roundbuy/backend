const { promisePool } = require('../../config/database');
const stripeService = require('../../services/stripe.service');

/**
 * Get all banner plans
 * GET /api/v1/admin/banner-plans
 */
const getAllPlans = async (req, res) => {
    try {
        const [plans] = await promisePool.query(`
      SELECT 
        bp.*,
        GROUP_CONCAT(DISTINCT CONCAT(c.code, ':', bpp.price) SEPARATOR ',') as currency_prices
      FROM banner_plans bp
      LEFT JOIN banner_plan_prices bpp ON bp.id = bpp.banner_plan_id
      LEFT JOIN currencies c ON bpp.currency_id = c.id
      GROUP BY bp.id
      ORDER BY bp.id DESC
    `);

        // Parse currency prices and dimensions
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
                dimensions: plan.dimensions ? JSON.parse(plan.dimensions) : {},
                allowed_for_subscription_ids: plan.allowed_for_subscription_ids ?
                    JSON.parse(plan.allowed_for_subscription_ids) : []
            };
        });

        res.json({
            success: true,
            data: plansWithPrices
        });
    } catch (error) {
        console.error('Get banner plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching banner plans',
            error: error.message
        });
    }
};

/**
 * Get single banner plan by ID
 * GET /api/v1/admin/banner-plans/:id
 */
const getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const [plans] = await promisePool.query(
            'SELECT * FROM banner_plans WHERE id = ?',
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Banner plan not found'
            });
        }

        const plan = plans[0];

        // Get prices for all currencies
        const [prices] = await promisePool.query(`
      SELECT bpp.*, c.code, c.symbol, c.name as currency_name
      FROM banner_plan_prices bpp
      JOIN currencies c ON bpp.currency_id = c.id
      WHERE bpp.banner_plan_id = ?
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
                dimensions: plan.dimensions ? JSON.parse(plan.dimensions) : {},
                allowed_for_subscription_ids: plan.allowed_for_subscription_ids ?
                    JSON.parse(plan.allowed_for_subscription_ids) : [],
                prices: pricesByCurrency
            }
        });
    } catch (error) {
        console.error('Get banner plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching banner plan',
            error: error.message
        });
    }
};

/**
 * Create new banner plan with Stripe integration
 * POST /api/v1/admin/banner-plans
 */
const createPlan = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            duration_days,
            placement,
            dimensions,
            is_active,
            allowed_for_subscription_ids,
            max_clicks,
            prices // { USD: 99.99, EUR: 84.99, INR: 8299 }
        } = req.body;

        // Validate required fields
        if (!name || !slug || !placement || !prices) {
            return res.status(400).json({
                success: false,
                message: 'Name, slug, placement, and prices are required'
            });
        }

        // Step 1: Create Stripe Product
        console.log(`Creating Stripe Product for: ${name}`);
        const stripeProduct = await stripeService.createProduct(
            name,
            description || '',
            {
                plan_type: 'banner',
                slug: slug,
                placement: placement
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
            { plan_slug: slug, currency: defaultCurrencyCode, placement: placement }
        );

        // Step 4: Insert plan into database
        const [result] = await promisePool.query(`
      INSERT INTO banner_plans 
      (name, slug, description, price, duration_days, placement, dimensions,
       is_active, allowed_for_subscription_ids, max_clicks, stripe_product_id, stripe_price_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            name,
            slug,
            description || null,
            defaultPrice,
            duration_days || 30,
            placement,
            JSON.stringify(dimensions || {}),
            is_active !== false,
            JSON.stringify(allowed_for_subscription_ids || []),
            max_clicks || null,
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
                    { plan_id: planId.toString(), currency: currency.code, placement: placement }
                );

                // Insert into database
                await promisePool.query(`
          INSERT INTO banner_plan_prices 
          (banner_plan_id, currency_id, price, tax_rate, stripe_price_id)
          VALUES (?, ?, ?, ?, ?)
        `, [planId, currency.id, price, 0, currencyStripePrice.id]);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Banner plan created successfully',
            data: {
                id: planId,
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id
            }
        });
    } catch (error) {
        console.error('Create banner plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating banner plan',
            error: error.message
        });
    }
};

/**
 * Update banner plan
 * PUT /api/v1/admin/banner-plans/:id
 */
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            duration_days,
            placement,
            dimensions,
            is_active,
            allowed_for_subscription_ids,
            max_clicks,
            prices
        } = req.body;

        // Get existing plan
        const [existingPlans] = await promisePool.query(
            'SELECT * FROM banner_plans WHERE id = ?',
            [id]
        );

        if (existingPlans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Banner plan not found'
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
                    slug: slug || existingPlan.slug,
                    placement: placement || existingPlan.placement
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
        if (placement) {
            updateFields.push('placement = ?');
            updateValues.push(placement);
        }
        if (dimensions) {
            updateFields.push('dimensions = ?');
            updateValues.push(JSON.stringify(dimensions));
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }
        if (allowed_for_subscription_ids) {
            updateFields.push('allowed_for_subscription_ids = ?');
            updateValues.push(JSON.stringify(allowed_for_subscription_ids));
        }
        if (max_clicks !== undefined) {
            updateFields.push('max_clicks = ?');
            updateValues.push(max_clicks);
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await promisePool.query(
                `UPDATE banner_plans SET ${updateFields.join(', ')} WHERE id = ?`,
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
            SELECT * FROM banner_plan_prices 
            WHERE banner_plan_id = ? AND currency_id = ?
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
                UPDATE banner_plan_prices 
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
                                    'UPDATE banner_plans SET price = ?, stripe_price_id = ? WHERE id = ?',
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
              INSERT INTO banner_plan_prices 
              (banner_plan_id, currency_id, price, stripe_price_id)
              VALUES (?, ?, ?, ?)
            `, [id, currency.id, newPrice, newStripePrice.id]);
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Banner plan updated successfully'
        });
    } catch (error) {
        console.error('Update banner plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating banner plan',
            error: error.message
        });
    }
};

/**
 * Delete (archive) banner plan
 * DELETE /api/v1/admin/banner-plans/:id
 */
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Get plan
        const [plans] = await promisePool.query(
            'SELECT * FROM banner_plans WHERE id = ?',
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Banner plan not found'
            });
        }

        const plan = plans[0];

        // Archive Stripe Product
        if (plan.stripe_product_id) {
            await stripeService.archiveProduct(plan.stripe_product_id);
        }

        // Soft delete in database (set inactive)
        await promisePool.query(
            'UPDATE banner_plans SET is_active = FALSE WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Banner plan archived successfully'
        });
    } catch (error) {
        console.error('Delete banner plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting banner plan',
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
