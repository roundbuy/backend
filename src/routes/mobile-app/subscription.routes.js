const express = require('express');
const router = express.Router();
const mobileSubscriptionController = require('../../controllers/mobile-app/subscription.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route GET /api/v1/mobile-app/subscription/plans
 * @desc Get all available subscription plans with multi-currency pricing
 * @access Public
 * @query {string} currency_code - Optional currency code (e.g., USD, EUR, INR)
 * @query {string} language - Optional language code (default: en)
 */
router.get('/plans', mobileSubscriptionController.getPlans);

/**
 * @route GET /api/v1/mobile-app/subscription/plans/:planId
 * @desc Get specific subscription plan details
 * @access Public
 * @param {number} planId - Plan ID
 * @query {string} currency_code - Optional currency code
 * @query {string} language - Optional language code (default: en)
 */
router.get('/plans/:planId', mobileSubscriptionController.getPlanDetails);

/**
 * @route POST /api/v1/mobile-app/subscription/purchase
 * @desc Purchase a subscription plan
 * @access Private (requires authentication)
 * @body {number} plan_id - Plan ID
 * @body {string} currency_code - Currency code (e.g., USD, INR)
 * @body {string} payment_method_id - Stripe payment method ID
 * @body {boolean} save_payment_method - Whether to save payment method (optional)
 * @body {string} country - Country code (optional)
 * @body {string} zip_code - ZIP code (optional)
 */
router.post('/purchase', authenticate, mobileSubscriptionController.purchasePlan);

/**
 * @route GET /api/v1/mobile-app/subscription/transaction/:transactionId
 * @desc Get transaction status and details
 * @access Private (requires authentication)
 * @param {string} transactionId - Transaction/Payment ID
 */
router.get('/transaction/:transactionId', authenticate, mobileSubscriptionController.getTransactionStatus);

/**
 * @route GET /api/v1/mobile-app/subscription/payment-methods
 * @desc Get user's saved payment methods
 * @access Private (requires authentication)
 */
router.get('/payment-methods', authenticate, mobileSubscriptionController.getSavedPaymentMethods);

/**
 * @route GET /api/v1/mobile-app/subscription/stripe-config
 * @desc Get Stripe configuration for frontend
 * @access Public
 */
router.get('/stripe-config', mobileSubscriptionController.getStripeConfig);

module.exports = router;