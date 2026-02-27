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

// Level Rewards routes
router.get('/level-status', rewardsController.getLevelStatus);
router.get('/level-rewards', rewardsController.getLevelRewards);
router.post('/redeem-level-reward', rewardsController.redeemLevelReward);

module.exports = router;
