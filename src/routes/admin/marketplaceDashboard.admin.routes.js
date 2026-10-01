const express = require('express');
const router = express.Router();
const marketplaceDashboardController = require('../../controllers/admin/marketplaceDashboard.controller');
const trafficAnalyticsController = require('../../controllers/admin/trafficAnalytics.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.get('/', authenticate, authorize('admin'), marketplaceDashboardController.getMarketplaceStats);
router.get('/traffic', authenticate, authorize('admin'), trafficAnalyticsController.getTrafficAnalytics);

module.exports = router;
