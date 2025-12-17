const express = require('express');
const router = express.Router();
const paddleController = require('../../controllers/mobile-app/paddle.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route GET /api/v1/mobile-app/paddle/client-token
 * @desc Get Paddle client token for frontend initialization
 * @access Public
 */
router.get('/client-token', paddleController.getClientToken);

/**
 * @route POST /api/v1/mobile-app/paddle/create-transaction
 * @desc Create a new Paddle transaction
 * @access Private (requires authentication)
 * @body {string} plan_id - Subscription plan ID
 * @body {string} currency_code - Currency code (e.g., USD, GBP)
 * @body {array} items - Optional array of items if not using plan_id
 */
router.post('/create-transaction', authenticate, paddleController.createTransaction);

/**
 * @route GET /api/v1/mobile-app/paddle/transaction/:transactionId
 * @desc Get transaction details
 * @access Private (requires authentication)
 */
router.get('/transaction/:transactionId', authenticate, paddleController.getTransaction);

/**
 * @route GET /api/v1/mobile-app/paddle/prices
 * @desc Get available prices from Paddle
 * @access Public
 */
router.get('/prices', paddleController.getPrices);

/**
 * @route POST /api/v1/mobile-app/paddle/webhook
 * @desc Handle Paddle webhooks
 * @access Public (verified by signature)
 */
router.post('/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }), paddleController.handleWebhook);

module.exports = router;