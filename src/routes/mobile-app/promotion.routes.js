const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/mobile-app/promotion.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route GET /api/v1/mobile-app/promotions/plans
 * @desc Get available promotion plans for user's subscription
 * @access Private (requires authentication)
 * @query {number} advertisement_id - Optional advertisement ID to check if it can be promoted
 */
router.get('/plans', authenticate, promotionController.getPromotionPlans);

/**
 * @route POST /api/v1/mobile-app/promotions/purchase
 * @desc Purchase promotion for an advertisement
 * @access Private (requires authentication)
 * @body {number} advertisement_id - Advertisement ID to promote
 * @body {number} promotion_plan_id - Promotion plan ID
 * @body {number} distance_boost_plan_id - Optional distance boost plan ID
 * @body {string} payment_method_id - Stripe payment method ID
 */
router.post('/purchase', authenticate, promotionController.purchasePromotion);

/**
 * @route GET /api/v1/mobile-app/promotions/active
 * @desc Get user's active promotions
 * @access Private (requires authentication)
 * @query {string} status - Filter by status: 'active', 'expired', 'all' (default: 'active')
 */
router.get('/active', authenticate, promotionController.getActivePromotions);

/**
 * @route PUT /api/v1/mobile-app/promotions/:id/cancel
 * @desc Cancel a promotion
 * @access Private (requires authentication)
 * @param {number} id - Promotion ID
 * @body {string} reason - Optional cancellation reason
 */
router.put('/:id/cancel', authenticate, promotionController.cancelPromotion);

/**
 * @route GET /api/v1/mobile-app/promotions/stats/:advertisement_id
 * @desc Get promotion statistics for an advertisement
 * @access Private (requires authentication)
 * @param {number} advertisement_id - Advertisement ID
 */
router.get('/stats/:advertisement_id', authenticate, promotionController.getPromotionStats);

module.exports = router;
