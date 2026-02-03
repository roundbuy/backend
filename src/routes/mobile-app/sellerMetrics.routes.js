
const express = require('express');
const router = express.Router();
const SellerMetricsController = require('../../controllers/SellerMetricsController');
const { authenticate } = require('../../middleware/auth.middleware');

// Public route to view seller metrics on their profile/product
router.get('/:sellerId', SellerMetricsController.getSellerMetrics);

module.exports = router;
