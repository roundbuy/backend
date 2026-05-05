const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/mobile-app/subscription.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route GET /api/v1/subscriptions/plans
 * @desc Get available subscription plans
 * @access Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route GET /api/v1/subscriptions/plans/:planId
 * @desc Get specific plan details
 * @access Public
 */
router.get('/plans/:planId', subscriptionController.getPlanDetails);

/**
 * @route POST /api/v1/subscriptions/create-payment-intent
 * @desc Create Stripe payment intent
 * @access Private
 */
router.post('/create-payment-intent', authenticate, subscriptionController.createPaymentIntent);

/**
 * @route POST /api/v1/subscriptions/purchase
 * @desc Complete subscription purchase
 * @access Private
 */
router.post('/purchase', authenticate, subscriptionController.purchasePlan);

/**
 * @route POST /api/v1/subscriptions/activate-free
 * @desc Activate free plan
 * @access Public
 */
router.post('/activate-free', subscriptionController.activateFreePlan);

/**
 * @route GET /api/v1/subscriptions/current
 * @desc Get current user subscription
 * @access Private
 */
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);

/**
 * @route GET /api/v1/subscriptions/stripe-config
 * @desc Get Stripe publishable key
 * @access Public
 */
router.get('/stripe-config', subscriptionController.getStripeConfig);

module.exports = router;