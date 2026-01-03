/**
 * Admin Notification Routes
 * 
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/admin/notification.controller');

// Middleware (using correct paths from existing project)
const { authenticate } = require('../../middleware/auth.middleware');
const { checkAdminRole } = require('../../middleware/admin.middleware');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(checkAdminRole(['admin', 'super_admin']));

/**
 * @route   POST /api/admin/notifications
 * @desc    Create a new notification
 * @access  Admin only
 */
router.post('/', notificationController.createNotification);

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all notifications with filters
 * @access  Admin only
 * @query   type, priority, targetAudience, sent, limit, offset
 */
router.get('/', notificationController.getAllNotifications);

/**
 * @route   POST /api/admin/notifications/preview-count
 * @desc    Preview recipient count before sending
 * @access  Admin only
 */
router.post('/preview-count', notificationController.previewTargetCount);

/**
 * @route   GET /api/admin/notifications/:id
 * @desc    Get notification by ID
 * @access  Admin only
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @route   PUT /api/admin/notifications/:id
 * @desc    Update a notification
 * @access  Admin only
 */
router.put('/:id', notificationController.updateNotification);

/**
 * @route   DELETE /api/admin/notifications/:id
 * @desc    Delete a notification (soft delete)
 * @access  Admin only
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   POST /api/admin/notifications/:id/send
 * @desc    Send a notification immediately
 * @access  Admin only
 */
router.post('/:id/send', notificationController.sendNotification);

/**
 * @route   GET /api/admin/notifications/:id/stats
 * @desc    Get notification statistics
 * @access  Admin only
 */
router.get('/:id/stats', notificationController.getNotificationStats);

module.exports = router;
