const { promisePool } = require('../../config/database');

// Function to get Stripe instance with configured key
const getStripeInstance = async () => {
    const [settings] = await promisePool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'stripe_secret_key' LIMIT 1"
    );

    if (settings.length === 0) {
        throw new Error('Stripe secret key not configured');
    }

    return require('stripe')(settings[0].setting_value);
};

/**
 * Get available promotion plans for user
 * GET /api/v1/mobile-app/promotions/plans
 */
const getPromotionPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const { advertisement_id } = req.query;

        // Get user's subscription plan and features
        const [users] = await promisePool.query(
            `SELECT u.id, u.subscription_plan_id, sp.features, sp.name as plan_name
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        const features = user.features ? (typeof user.features === 'string' ? JSON.parse(user.features) : user.features) : {};
        const promotionLimits = features.promotion_limits || {
            max_active_promotions: 1,
            allowed_promotion_types: ['fast'],
            distance_boost_included: false,
            promotion_discount_percent: 0
        };

        // Get user's current active promotions count
        const [activePromotions] = await promisePool.query(
            `SELECT COUNT(*) as count FROM advertisement_promotions
       WHERE user_id = ? AND is_active = TRUE AND end_date > NOW()`,
            [userId]
        );

        const currentActiveCount = activePromotions[0].count;
        const maxAllowed = promotionLimits.max_active_promotions;
        const remainingSlots = maxAllowed === -1 ? 999 : Math.max(0, maxAllowed - currentActiveCount);

        // Get all active promotion plans
        const [plans] = await promisePool.query(
            `SELECT id, name, slug, description, plan_type, priority_level,
              duration_days, duration_label, base_price, discounted_price,
              currency_code, distance_boost_km, allows_distance_boost,
              features, sort_order
       FROM advertisement_promotion_plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
        );

        // Filter plans based on user's subscription
        const allowedTypes = promotionLimits.allowed_promotion_types || [];
        const filteredPlans = plans.filter(plan => {
            return allowedTypes.includes(plan.plan_type) || allowedTypes.length === 0;
        });

        // Apply subscription discount
        const discountPercent = promotionLimits.promotion_discount_percent || 0;
        const plansWithDiscount = filteredPlans.map(plan => {
            const basePrice = parseFloat(plan.discounted_price);
            const discountAmount = (basePrice * discountPercent) / 100;
            const finalPrice = basePrice - discountAmount;

            return {
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                plan_type: plan.plan_type,
                priority_level: plan.priority_level,
                duration_days: plan.duration_days,
                duration_label: plan.duration_label,
                base_price: parseFloat(plan.base_price),
                discounted_price: basePrice,
                final_price: finalPrice,
                currency_code: plan.currency_code,
                distance_boost_km: plan.distance_boost_km,
                allows_distance_boost: plan.allows_distance_boost,
                features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : {},
                has_subscription_discount: discountPercent > 0,
                subscription_discount_percent: discountPercent
            };
        });

        // Get distance boost plans
        const [distanceBoosts] = await promisePool.query(
            `SELECT id, name, slug, description, distance_km, is_unlimited,
              base_price, discounted_price, currency_code, sort_order
       FROM distance_boost_plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
        );

        const distanceBoostsWithDiscount = distanceBoosts.map(boost => {
            const basePrice = parseFloat(boost.discounted_price);
            const discountAmount = promotionLimits.distance_boost_included ? basePrice : (basePrice * discountPercent) / 100;
            const finalPrice = promotionLimits.distance_boost_included ? 0 : basePrice - discountAmount;

            return {
                id: boost.id,
                name: boost.name,
                slug: boost.slug,
                description: boost.description,
                distance_km: boost.distance_km,
                is_unlimited: boost.is_unlimited,
                base_price: parseFloat(boost.base_price),
                discounted_price: basePrice,
                final_price: finalPrice,
                currency_code: boost.currency_code,
                is_free: promotionLimits.distance_boost_included
            };
        });

        // If advertisement_id is provided, check if it can be promoted
        let advertisementInfo = null;
        if (advertisement_id) {
            const [ads] = await promisePool.query(
                `SELECT id, title, status, user_id FROM advertisements
         WHERE id = ? AND user_id = ?`,
                [advertisement_id, userId]
            );

            if (ads.length > 0) {
                const ad = ads[0];

                // Check if ad already has an active promotion
                const [existingPromo] = await promisePool.query(
                    `SELECT id, plan_type, end_date FROM advertisement_promotions
           WHERE advertisement_id = ? AND is_active = TRUE AND end_date > NOW()
           ORDER BY priority_level DESC LIMIT 1`,
                    [advertisement_id]
                );

                advertisementInfo = {
                    id: ad.id,
                    title: ad.title,
                    status: ad.status,
                    can_promote: ad.status === 'published',
                    has_active_promotion: existingPromo.length > 0,
                    active_promotion: existingPromo.length > 0 ? {
                        id: existingPromo[0].id,
                        plan_type: existingPromo[0].plan_type,
                        end_date: existingPromo[0].end_date
                    } : null
                };
            }
        }

        res.json({
            success: true,
            data: {
                plans: plansWithDiscount,
                distance_boosts: distanceBoostsWithDiscount,
                user_limits: {
                    max_active_promotions: maxAllowed,
                    current_active: currentActiveCount,
                    remaining_slots: remainingSlots,
                    allowed_promotion_types: allowedTypes,
                    distance_boost_included: promotionLimits.distance_boost_included,
                    subscription_discount_percent: discountPercent,
                    subscription_plan: user.plan_name
                },
                advertisement: advertisementInfo
            }
        });
    } catch (error) {
        console.error('Get promotion plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching promotion plans',
            error: error.message
        });
    }
};

/**
 * Purchase promotion for an advertisement
 * POST /api/v1/mobile-app/promotions/purchase
 */
const purchasePromotion = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            advertisement_id,
            promotion_plan_id,
            distance_boost_plan_id = null,
            payment_method_id
        } = req.body;

        // Validate required fields
        if (!advertisement_id || !promotion_plan_id || !payment_method_id) {
            return res.status(400).json({
                success: false,
                message: 'Advertisement ID, promotion plan ID, and payment method ID are required'
            });
        }

        // Verify advertisement ownership
        const [ads] = await promisePool.query(
            'SELECT id, title, status, user_id FROM advertisements WHERE id = ? AND user_id = ?',
            [advertisement_id, userId]
        );

        if (ads.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found or unauthorized'
            });
        }

        const advertisement = ads[0];

        if (advertisement.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Only published advertisements can be promoted'
            });
        }

        // Get user's subscription limits
        const [users] = await promisePool.query(
            `SELECT u.id, u.email, u.full_name, sp.features
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
            [userId]
        );

        const user = users[0];
        const features = user.features ? (typeof user.features === 'string' ? JSON.parse(user.features) : user.features) : {};
        const promotionLimits = features.promotion_limits || { max_active_promotions: 1 };

        // Check promotion limits
        const [activePromotions] = await promisePool.query(
            `SELECT COUNT(*) as count FROM advertisement_promotions
       WHERE user_id = ? AND is_active = TRUE AND end_date > NOW()`,
            [userId]
        );

        const maxAllowed = promotionLimits.max_active_promotions;
        if (maxAllowed !== -1 && activePromotions[0].count >= maxAllowed) {
            return res.status(400).json({
                success: false,
                message: `You have reached your promotion limit (${maxAllowed}). Upgrade your subscription for more promotions.`
            });
        }

        // Get promotion plan details
        const [plans] = await promisePool.query(
            `SELECT id, name, plan_type, priority_level, duration_days, duration_label,
              discounted_price, currency_code, distance_boost_km, features
       FROM advertisement_promotion_plans
       WHERE id = ? AND is_active = TRUE`,
            [promotion_plan_id]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion plan not found'
            });
        }

        const plan = plans[0];

        // Get distance boost details if applicable
        let distanceBoost = null;
        let distanceBoostKm = plan.distance_boost_km;
        let isDistanceUnlimited = false;

        if (distance_boost_plan_id) {
            const [boosts] = await promisePool.query(
                `SELECT id, name, distance_km, is_unlimited, discounted_price, currency_code
         FROM distance_boost_plans
         WHERE id = ? AND is_active = TRUE`,
                [distance_boost_plan_id]
            );

            if (boosts.length > 0) {
                distanceBoost = boosts[0];
                distanceBoostKm = distanceBoost.distance_km || distanceBoostKm;
                isDistanceUnlimited = distanceBoost.is_unlimited;
            }
        }

        // Calculate pricing with subscription discount
        const discountPercent = promotionLimits.promotion_discount_percent || 0;
        const planPrice = parseFloat(plan.discounted_price);
        const planDiscount = (planPrice * discountPercent) / 100;
        const finalPlanPrice = planPrice - planDiscount;

        let distanceBoostPrice = 0;
        if (distanceBoost) {
            const boostPrice = parseFloat(distanceBoost.discounted_price);
            if (promotionLimits.distance_boost_included) {
                distanceBoostPrice = 0; // Free for higher tier subscriptions
            } else {
                const boostDiscount = (boostPrice * discountPercent) / 100;
                distanceBoostPrice = boostPrice - boostDiscount;
            }
        }

        const totalPrice = finalPlanPrice + distanceBoostPrice;

        // Create Stripe payment intent
        const stripe = await getStripeInstance();

        // Get or create Stripe customer
        let stripeCustomerId = null;
        const [existingCustomers] = await promisePool.query(
            'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
            [userId]
        );

        if (existingCustomers.length > 0) {
            stripeCustomerId = existingCustomers[0].stripe_customer_id;
        } else {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: { user_id: userId }
            });
            stripeCustomerId = customer.id;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100), // Convert to cents
            currency: plan.currency_code.toLowerCase(),
            customer: stripeCustomerId,
            payment_method: payment_method_id,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            metadata: {
                user_id: userId,
                advertisement_id: advertisement_id,
                promotion_plan_id: promotion_plan_id,
                plan_type: plan.plan_type,
                distance_boost_plan_id: distance_boost_plan_id || 'none'
            }
        });

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment failed',
                payment_status: paymentIntent.status
            });
        }

        // Calculate promotion dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        // Create promotion record
        const [promoResult] = await promisePool.query(
            `INSERT INTO advertisement_promotions
       (advertisement_id, user_id, advertisement_plan_id, distance_boost_plan_id,
        plan_type, priority_level, duration_days, duration_label,
        start_date, end_date, distance_boost_km, is_distance_unlimited,
        plan_price, distance_boost_price, total_price, currency_code,
        payment_status, payment_intent_id, payment_method, paid_at,
        status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, 'card', NOW(), 'active', TRUE)`,
            [
                advertisement_id, userId, promotion_plan_id, distance_boost_plan_id,
                plan.plan_type, plan.priority_level, plan.duration_days, plan.duration_label,
                startDate, endDate, distanceBoostKm, isDistanceUnlimited,
                finalPlanPrice, distanceBoostPrice, totalPrice, plan.currency_code,
                paymentIntent.id
            ]
        );

        // Update advertisement featured status if it's a show_casing promotion
        if (plan.plan_type === 'show_casing') {
            await promisePool.query(
                'UPDATE advertisements SET featured = TRUE WHERE id = ?',
                [advertisement_id]
            );
        }

        res.json({
            success: true,
            message: 'Promotion purchased successfully',
            data: {
                promotion: {
                    id: promoResult.insertId,
                    advertisement_id: advertisement_id,
                    advertisement_title: advertisement.title,
                    plan_name: plan.name,
                    plan_type: plan.plan_type,
                    priority_level: plan.priority_level,
                    duration_days: plan.duration_days,
                    duration_label: plan.duration_label,
                    start_date: startDate,
                    end_date: endDate,
                    distance_boost_km: distanceBoostKm,
                    is_distance_unlimited: isDistanceUnlimited,
                    plan_price: finalPlanPrice,
                    distance_boost_price: distanceBoostPrice,
                    total_price: totalPrice,
                    currency: plan.currency_code,
                    payment_id: paymentIntent.id,
                    status: 'active'
                }
            }
        });
    } catch (error) {
        console.error('Purchase promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error purchasing promotion',
            error: error.message
        });
    }
};

/**
 * Get user's active promotions
 * GET /api/v1/mobile-app/promotions/active
 */
const getActivePromotions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status = 'active' } = req.query;

        let whereClause = 'ap.user_id = ?';
        const params = [userId];

        if (status === 'active') {
            whereClause += ' AND ap.is_active = TRUE AND ap.end_date > NOW()';
        } else if (status === 'expired') {
            whereClause += ' AND (ap.is_active = FALSE OR ap.end_date <= NOW())';
        } else if (status === 'all') {
            // No additional filter
        }

        const [promotions] = await promisePool.query(
            `SELECT ap.*, 
              app.name as plan_name,
              a.title as advertisement_title,
              a.status as advertisement_status,
              db.name as distance_boost_name,
              db.distance_km as boost_distance_km
       FROM advertisement_promotions ap
       JOIN advertisement_promotion_plans app ON ap.advertisement_plan_id = app.id
       JOIN advertisements a ON ap.advertisement_id = a.id
       LEFT JOIN distance_boost_plans db ON ap.distance_boost_plan_id = db.id
       WHERE ${whereClause}
       ORDER BY ap.created_at DESC`,
            params
        );

        const formattedPromotions = promotions.map(promo => ({
            id: promo.id,
            advertisement_id: promo.advertisement_id,
            advertisement_title: promo.advertisement_title,
            advertisement_status: promo.advertisement_status,
            plan_name: promo.plan_name,
            plan_type: promo.plan_type,
            priority_level: promo.priority_level,
            duration_days: promo.duration_days,
            duration_label: promo.duration_label,
            start_date: promo.start_date,
            end_date: promo.end_date,
            distance_boost_km: promo.distance_boost_km,
            is_distance_unlimited: promo.is_distance_unlimited,
            distance_boost_name: promo.distance_boost_name,
            plan_price: parseFloat(promo.plan_price),
            distance_boost_price: parseFloat(promo.distance_boost_price),
            total_price: parseFloat(promo.total_price),
            currency_code: promo.currency_code,
            payment_status: promo.payment_status,
            status: promo.status,
            is_active: promo.is_active,
            impressions_count: promo.impressions_count,
            clicks_count: promo.clicks_count,
            views_count: promo.views_count,
            created_at: promo.created_at,
            updated_at: promo.updated_at
        }));

        res.json({
            success: true,
            data: {
                promotions: formattedPromotions,
                total: formattedPromotions.length
            }
        });
    } catch (error) {
        console.error('Get active promotions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching promotions',
            error: error.message
        });
    }
};

/**
 * Cancel a promotion
 * PUT /api/v1/mobile-app/promotions/:id/cancel
 */
const cancelPromotion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        // Verify promotion ownership
        const [promotions] = await promisePool.query(
            `SELECT ap.*, a.title as advertisement_title
       FROM advertisement_promotions ap
       JOIN advertisements a ON ap.advertisement_id = a.id
       WHERE ap.id = ? AND ap.user_id = ?`,
            [id, userId]
        );

        if (promotions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found or unauthorized'
            });
        }

        const promotion = promotions[0];

        if (promotion.status === 'cancelled' || promotion.status === 'expired') {
            return res.status(400).json({
                success: false,
                message: 'Promotion is already cancelled or expired'
            });
        }

        // Update promotion status
        await promisePool.query(
            `UPDATE advertisement_promotions
       SET status = 'cancelled', is_active = FALSE, rejection_reason = ?
       WHERE id = ?`,
            [reason || 'Cancelled by user', id]
        );

        // If it was a show_casing promotion, update advertisement featured status
        if (promotion.plan_type === 'show_casing') {
            // Check if there are other active show_casing promotions for this ad
            const [otherPromos] = await promisePool.query(
                `SELECT COUNT(*) as count FROM advertisement_promotions
         WHERE advertisement_id = ? AND plan_type = 'show_casing'
         AND is_active = TRUE AND end_date > NOW() AND id != ?`,
                [promotion.advertisement_id, id]
            );

            if (otherPromos[0].count === 0) {
                await promisePool.query(
                    'UPDATE advertisements SET featured = FALSE WHERE id = ?',
                    [promotion.advertisement_id]
                );
            }
        }

        // TODO: Process refund if applicable (based on cancellation policy)
        // For now, we'll just cancel without refund

        res.json({
            success: true,
            message: 'Promotion cancelled successfully',
            data: {
                promotion_id: id,
                advertisement_title: promotion.advertisement_title,
                status: 'cancelled'
            }
        });
    } catch (error) {
        console.error('Cancel promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling promotion',
            error: error.message
        });
    }
};

/**
 * Get promotion statistics for an advertisement
 * GET /api/v1/mobile-app/promotions/stats/:advertisement_id
 */
const getPromotionStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { advertisement_id } = req.params;

        // Verify advertisement ownership
        const [ads] = await promisePool.query(
            'SELECT id, title FROM advertisements WHERE id = ? AND user_id = ?',
            [advertisement_id, userId]
        );

        if (ads.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advertisement not found or unauthorized'
            });
        }

        // Get all promotions for this advertisement
        const [promotions] = await promisePool.query(
            `SELECT ap.*, app.name as plan_name
       FROM advertisement_promotions ap
       JOIN advertisement_promotion_plans app ON ap.advertisement_plan_id = app.id
       WHERE ap.advertisement_id = ?
       ORDER BY ap.created_at DESC`,
            [advertisement_id]
        );

        // Calculate total stats
        const totalStats = promotions.reduce((acc, promo) => {
            acc.total_spent += parseFloat(promo.total_price);
            acc.total_impressions += promo.impressions_count;
            acc.total_clicks += promo.clicks_count;
            acc.total_views += promo.views_count;
            acc.total_promotions += 1;

            if (promo.is_active && new Date(promo.end_date) > new Date()) {
                acc.active_promotions += 1;
            }

            return acc;
        }, {
            total_spent: 0,
            total_impressions: 0,
            total_clicks: 0,
            total_views: 0,
            total_promotions: 0,
            active_promotions: 0
        });

        res.json({
            success: true,
            data: {
                advertisement: {
                    id: ads[0].id,
                    title: ads[0].title
                },
                stats: totalStats,
                promotions: promotions.map(promo => ({
                    id: promo.id,
                    plan_name: promo.plan_name,
                    plan_type: promo.plan_type,
                    start_date: promo.start_date,
                    end_date: promo.end_date,
                    total_price: parseFloat(promo.total_price),
                    impressions: promo.impressions_count,
                    clicks: promo.clicks_count,
                    views: promo.views_count,
                    status: promo.status,
                    is_active: promo.is_active
                }))
            }
        });
    } catch (error) {
        console.error('Get promotion stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching promotion statistics',
            error: error.message
        });
    }
};

module.exports = {
    getPromotionPlans,
    purchasePromotion,
    getActivePromotions,
    cancelPromotion,
    getPromotionStats
};
