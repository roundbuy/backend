const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/mobile-app/onboarding.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// GET /api/v1/admin/onboarding/analytics
router.get('/analytics', authenticate, authorize('admin'), onboardingController.getAnalytics);

module.exports = router;
