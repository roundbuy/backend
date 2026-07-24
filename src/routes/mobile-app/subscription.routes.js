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
 * @route POST /api/v1/mobile-app/subscription/create-payment-intent
 * @desc Create a payment intent for subscription purchase
 * @access Private (requires authentication)
 * @body {number} plan_id - Plan ID
 * @body {string} currency_code - Currency code (e.g., USD, INR)
 */
router.post('/create-payment-intent', authenticate, mobileSubscriptionController.createPaymentIntent);

/**
 * @route POST /api/v1/mobile-app/subscription/create-payment-method
 * @desc Create payment method (server-side tokenization)
 * @access Private (requires authentication)
 * @body {string} card_number - Card number
 * @body {string} exp_month - Expiry month (MM)
 * @body {string} exp_year - Expiry year (YY or YYYY)
 * @body {string} cvc - Card CVC
 * @body {object} billing_details - Optional billing details
 */
router.post('/create-payment-method', authenticate, mobileSubscriptionController.createPaymentMethod);

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
 * @route POST /api/v1/mobile-app/subscription/activate-free
 * @desc Activate free plan (Green plan) for user
 * @access Public (allows new users after email verification)
 * @body {string} email - User's email (required for new users)
 */
router.post('/activate-free', mobileSubscriptionController.activateFreePlan);

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

/**
 * @route GET /api/v1/mobile-app/subscription/current
 * @desc Get current user subscription
 * @access Private (requires authentication)
 */
router.get('/current', authenticate, mobileSubscriptionController.getCurrentSubscription);

/**
 * @route POST /api/v1/mobile-app/subscription/create-setup-intent
 * @desc Create a Stripe SetupIntent for saving a card with off-session mandate
 * @access Private (requires authentication)
 */
router.post('/create-setup-intent', authenticate, mobileSubscriptionController.createSetupIntent);

/**
 * @route POST /api/v1/mobile-app/subscription/save-payment-method
 * @desc Save a confirmed payment method (after SetupIntent confirmation)
 * @access Private (requires authentication)
 * @body {string} payment_method_id - Stripe PM ID (pm_...)
 * @body {boolean} set_as_default - Make this the default card
 */
router.post('/save-payment-method', authenticate, mobileSubscriptionController.savePaymentMethod);

/**
 * @route DELETE /api/v1/mobile-app/subscription/payment-methods/:id
 * @desc Remove a saved payment method
 * @access Private (requires authentication)
 */
router.delete('/payment-methods/:id', authenticate, mobileSubscriptionController.removePaymentMethod);

/**
 * @route PUT /api/v1/mobile-app/subscription/payment-methods/:id/default
 * @desc Set a payment method as default
 * @access Private (requires authentication)
 */
router.put('/payment-methods/:id/default', authenticate, mobileSubscriptionController.setDefaultPaymentMethod);

module.exports = router;