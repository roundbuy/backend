const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/mobile-app/checkout.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Checkout Flow Routes
router.get('/config', authenticate, checkoutController.getCheckoutConfig);
router.post('/save-address', authenticate, checkoutController.saveAddress);
router.post('/create-payment-intent', authenticate, checkoutController.createPaymentIntent);
router.post('/process-order', authenticate, checkoutController.processOrder);

module.exports = router;
