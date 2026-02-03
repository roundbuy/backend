/**
 * Mobile App Campaign Notification Routes
 */

const express = require('express');
const router = express.Router();
const campaignNotificationController = require('../../controllers/mobile-app/campaignNotification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get campaign notifications
router.get('/', campaignNotificationController.getCampaignNotifications);

// Mark as read
router.post('/:id/read', campaignNotificationController.markAsRead);

// Mark as clicked
router.post('/:id/click', campaignNotificationController.markAsClicked);

// Dismiss notification
router.post('/:id/dismiss', campaignNotificationController.dismissNotification);

// Get user stats
router.get('/stats', campaignNotificationController.getUserStats);

module.exports = router;
