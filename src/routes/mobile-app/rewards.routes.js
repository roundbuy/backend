const express = require('express');
const router = express.Router();
const rewardsController = require('../../controllers/mobile-app/rewards.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Public routes
router.post('/validate-referral', rewardsController.validateReferralCode);

// Apply auth middleware to all routes
router.use(authenticate);

// Get all reward categories with user progress
router.get('/', rewardsController.getRewards);

// Referral routes
router.get('/referrals', rewardsController.getReferrals);
router.post('/referral/generate', rewardsController.generateReferralCode);

// Lottery routes
router.get('/lottery', rewardsController.getLotteryInfo);

// Popular searches routes
router.get('/popular-searches', rewardsController.getPopularSearches);

module.exports = router;
