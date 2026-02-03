/**
 * Admin Campaign Notification Routes
 */

const express = require('express');
const router = express.Router();
const campaignNotificationController = require('../../controllers/admin/campaignNotification.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { checkAdminRole } = require('../../middleware/admin.middleware');

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(checkAdminRole(['admin', 'super_admin']));

// Campaign notification CRUD
router.get('/', campaignNotificationController.getAllCampaignNotifications);
router.get('/:id', campaignNotificationController.getCampaignNotificationById);
router.put('/:id', campaignNotificationController.updateCampaignNotification);
router.post('/:id/toggle', campaignNotificationController.toggleCampaignNotification);

// Sending notifications
router.post('/:id/send', campaignNotificationController.sendCampaignNotification);
router.post('/:id/send-to-user', campaignNotificationController.sendToSpecificUsers);
router.post('/:id/send-to-group', campaignNotificationController.sendToUserGroup);
router.post('/:id/test', campaignNotificationController.testSendCampaignNotification);

// Statistics and scheduled sends
router.get('/:id/stats', campaignNotificationController.getCampaignNotificationStats);
router.get('/:id/scheduled', campaignNotificationController.getScheduledSends);
router.delete('/scheduled/:triggerId', campaignNotificationController.cancelScheduledSend);

// Utilities
router.post('/preview-count', campaignNotificationController.previewRecipientCount);
router.get('/users/search', campaignNotificationController.searchUsers);

module.exports = router;
