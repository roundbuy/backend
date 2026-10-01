
const express = require('express');
const router = express.Router();
const SellerMetricsController = require('../../controllers/SellerMetricsController');
const { authenticate } = require('../../middleware/auth.middleware');

// Authenticated: seller views their own performance KPIs + seller score + tips
router.get('/me', authenticate, SellerMetricsController.getMySellerMetrics);

// Public route to view any seller's metrics (profile/product page)
router.get('/:sellerId', SellerMetricsController.getSellerMetrics);

module.exports = router;

