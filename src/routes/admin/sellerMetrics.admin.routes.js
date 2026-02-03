
const express = require('express');
const router = express.Router();
const SellerMetricsController = require('../../controllers/SellerMetricsController');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Admin route to view all seller metrics
router.get('/', authenticate, authorize('admin'), SellerMetricsController.getAllSellerMetrics);

module.exports = router;
