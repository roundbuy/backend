/**
 * Mobile App Notification Routes
 * 
 * Some routes require authentication, others work for guests too
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/mobile-app/notification.controller');

// Middleware
const { authenticate } = require('../../middleware/auth.middleware');

// Optional authentication middleware (allows both authenticated and guest users)
const optionalAuth = (req, res, next) => {
    // Try to authenticate, but don't fail if token is missing
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // No token, continue as guest
        return next();
    }

    // Token exists, try to authenticate
    authenticate(req, res, next);
};

/**
 * @route   POST /api/mobile/notifications/device-token
 * @desc    Register device token for push notifications
 * @access  Public (works for both users and guests)
 */
router.post('/device-token', optionalAuth, notificationController.registerDeviceToken);

/**
 * @route   DELETE /api/mobile/notifications/device-token
 * @desc    Remove device token
 * @access  Public (works for both users and guests)
 */
router.delete('/device-token', optionalAuth, notificationController.removeDeviceToken);

/**
 * @route   GET /api/mobile/notifications/heartbeat
 * @desc    Check for new notifications (heartbeat polling)
 * @access  Public (works for both users and guests)
 * @query   deviceId (required for guests), lastCheck (optional timestamp)
 */
router.get('/heartbeat', optionalAuth, notificationController.heartbeat);

/**
 * @route   GET /api/mobile/notifications
 * @desc    Get user's notifications with pagination
 * @access  Private (requires authentication)
 * @query   limit, offset
 */
router.get('/', authenticate, notificationController.getMyNotifications);

/**
 * @route   GET /api/mobile/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (requires authentication)
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @route   GET /api/mobile/notifications/my-devices
 * @desc    Get user's registered devices
 * @access  Private (requires authentication)
 */
router.get('/my-devices', authenticate, notificationController.getMyDevices);

/**
 * @route   PUT /api/mobile/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (requires authentication)
 */
router.put('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @route   PUT /api/mobile/notifications/:id/clicked
 * @desc    Mark notification as clicked
 * @access  Private (requires authentication)
 */
router.put('/:id/clicked', authenticate, notificationController.markAsClicked);

/**
 * @route   PUT /api/mobile/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (requires authentication)
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/mobile/notifications/:id
 * @desc    Delete a notification for the user
 * @access  Private (requires authentication)
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
