/**
 * Mobile App Notification Controller
 * 
 * Handles notification operations for mobile app users.
 * Supports both authenticated users and guest users.
 */

const userNotificationService = require('../../services/userNotification.service');
const deviceTokenService = require('../../services/deviceToken.service');
const heartbeatService = require('../../services/heartbeat.service');

/**
 * Get user's notifications with pagination
 * GET /api/mobile/notifications
 * Requires authentication
 */
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const notifications = await userNotificationService.getUserNotifications(
            userId,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Get my notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notifications'
        });
    }
};

/**
 * Get unread notification count
 * GET /api/mobile/notifications/unread-count
 * Requires authentication
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await userNotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch unread count'
        });
    }
};

/**
 * Mark a notification as read
 * PUT /api/mobile/notifications/:id/read
 * Requires authentication
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await userNotificationService.markAsRead(userId, id);

        res.json(result);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark as read'
        });
    }
};

/**
 * Mark a notification as clicked
 * PUT /api/mobile/notifications/:id/clicked
 * Requires authentication
 */
exports.markAsClicked = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await userNotificationService.markAsClicked(userId, id);

        res.json(result);
    } catch (error) {
        console.error('Mark as clicked error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark as clicked'
        });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/mobile/notifications/read-all
 * Requires authentication
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await userNotificationService.markAllAsRead(userId);

        res.json(result);
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark all as read'
        });
    }
};

/**
 * Delete a notification for the user
 * DELETE /api/mobile/notifications/:id
 * Requires authentication
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await userNotificationService.deleteUserNotification(userId, id);

        res.json(result);
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete notification'
        });
    }
};

/**
 * Register device token for push notifications
 * POST /api/mobile/notifications/device-token
 * Works for both authenticated users and guests
 */
exports.registerDeviceToken = async (req, res) => {
    try {
        const { deviceToken, platform, deviceId, deviceName } = req.body;

        // Validate required fields
        if (!deviceToken || !platform) {
            return res.status(400).json({
                success: false,
                message: 'Device token and platform are required'
            });
        }

        // Get userId from auth if available, otherwise null (guest)
        const userId = req.user ? req.user.id : null;

        // For guests, deviceId is required
        if (!userId && !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required for guest users'
            });
        }

        const result = await deviceTokenService.registerDeviceToken({
            userId,
            deviceToken,
            platform,
            deviceId,
            deviceName
        });

        res.json(result);
    } catch (error) {
        console.error('Register device token error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to register device token'
        });
    }
};

/**
 * Remove device token (logout or uninstall)
 * DELETE /api/mobile/notifications/device-token
 * Works for both authenticated users and guests
 */
exports.removeDeviceToken = async (req, res) => {
    try {
        const { deviceToken } = req.body;

        if (!deviceToken) {
            return res.status(400).json({
                success: false,
                message: 'Device token is required'
            });
        }

        const result = await deviceTokenService.deleteDeviceToken(deviceToken);

        res.json(result);
    } catch (error) {
        console.error('Remove device token error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove device token'
        });
    }
};

/**
 * Heartbeat endpoint - Check for new notifications
 * GET /api/mobile/notifications/heartbeat
 * Works for both authenticated users and guests
 */
exports.heartbeat = async (req, res) => {
    try {
        const { deviceId, lastCheck } = req.query;
        const userId = req.user ? req.user.id : null;

        // Parse lastCheck timestamp
        const lastCheckAt = lastCheck ? new Date(lastCheck) : null;

        let result;

        if (userId) {
            // Authenticated user
            result = await heartbeatService.checkForNewNotifications(userId, lastCheckAt);
        } else if (deviceId) {
            // Guest user
            result = await heartbeatService.checkForNewNotificationsGuest(deviceId, lastCheckAt);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either authentication or deviceId is required'
            });
        }

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Heartbeat check failed'
        });
    }
};

/**
 * Get device tokens for current user
 * GET /api/mobile/notifications/my-devices
 * Requires authentication
 */
exports.getMyDevices = async (req, res) => {
    try {
        const userId = req.user.id;

        const devices = await deviceTokenService.getDeviceTokens(userId);

        res.json({
            success: true,
            devices,
            count: devices.length
        });
    } catch (error) {
        console.error('Get my devices error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch devices'
        });
    }
};
