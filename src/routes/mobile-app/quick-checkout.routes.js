const express = require('express');
const router = express.Router();
const qc = require('../../controllers/mobile-app/quick-checkout.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All quick-checkout routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/mobile-app/quick-checkout/config/:advertisementId
 * @desc  Return fee breakdown + default payment method for 1-click buy overlay
 * @access Private
 */
router.get('/config/:advertisementId', qc.getQuickConfig);

/**
 * @route POST /api/v1/mobile-app/quick-checkout/buy
 * @desc  Charge user's default Stripe payment method and create quick_order
 * @access Private
 * @body  { advertisementId, deliveryOption? }
 */
router.post('/buy', qc.quickBuy);

/**
 * @route POST /api/v1/mobile-app/quick-checkout/cancel/:orderId
 * @desc  Cancel a quick order within the grace window; issues Stripe refund
 * @access Private
 * @body  { reason?, reason_detail? }
 */
router.post('/cancel/:orderId', qc.cancelOrder);

/**
 * @route GET /api/v1/mobile-app/quick-checkout/payment-methods
 * @desc  List all saved payment methods for current user
 * @access Private
 */
router.get('/payment-methods', qc.getPaymentMethods);

/**
 * @route POST /api/v1/mobile-app/quick-checkout/payment-methods
 * @desc  Save a tokenized payment method (Stripe) to user account
 * @access Private
 */
router.post('/payment-methods', qc.savePaymentMethod);

/**
 * @route PUT /api/v1/mobile-app/quick-checkout/payment-methods/:id/default
 * @desc  Set a saved payment method as default
 * @access Private
 */
router.put('/payment-methods/:id/default', qc.setDefaultPaymentMethod);

/**
 * @route DELETE /api/v1/mobile-app/quick-checkout/payment-methods/:id
 * @desc  Remove a saved payment method
 * @access Private
 */
router.delete('/payment-methods/:id', qc.deletePaymentMethod);

module.exports = router;
