const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Feedback Routes
 * All routes require authentication
 */

// Get transactions eligible for feedback
router.get('/eligible', authenticate, feedbackController.getEligibleForFeedback);

// Create a new feedback
router.post('/', authenticate, feedbackController.createFeedback);

// Get feedbacks received by current user
router.get('/my-feedbacks', authenticate, feedbackController.getMyFeedbacks);

// Get feedbacks for a specific user (public, but requires auth)
router.get('/user/:userId', authenticate, feedbackController.getUserFeedbacks);

// Get feedback statistics for a user
router.get('/stats/:userId', authenticate, feedbackController.getFeedbackStats);

// Check if user can give feedback for a specific advertisement
router.get('/can-give/:advertisementId', authenticate, feedbackController.checkCanGiveFeedback);

module.exports = router;
