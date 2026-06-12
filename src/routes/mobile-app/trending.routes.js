const express = require('express');
const router = express.Router();
const trendingController = require('../../controllers/mobile-app/trending.controller');

/**
 * @route GET /api/v1/mobile-app/trending/galleries
 * @desc List all active trending galleries
 */
router.get('/galleries', trendingController.getGalleries);

/**
 * @route GET /api/v1/mobile-app/trending/galleries/:id/items
 * @desc Get items in a specific trending gallery
 */
router.get('/galleries/:id/items', trendingController.getGalleryItems);

/**
 * @route GET /api/v1/mobile-app/trending/feed
 * @desc Filtered trending items feed
 */
router.get('/feed', trendingController.getTrendingFeed);

module.exports = router;
