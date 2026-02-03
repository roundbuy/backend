const express = require('express');
const router = express.Router();
const platformReviewController = require('../controllers/platformReviewController');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, platformReviewController.createReview);
router.get('/:type', authenticate, platformReviewController.getReviews);

module.exports = router;
