const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/mobile-app/onboarding.controller');

router.post('/track', onboardingController.trackEvent);
router.post('/track', onboardingController.trackEvent);

module.exports = router;
