/**
 * Admin Notification Controller
 * 
 * Handles admin operations for creating, managing, and sending notifications.
 * Requires admin authentication.
 */

const notificationService = require('../../services/notification.service');
const userNotificationService = require('../../services/userNotification.service');
const deviceTokenService = require('../../services/deviceToken.service');

/**
 * Create a new notification
 * POST /api/admin/notifications
 */
exports.createNotification = async (req, res) => {
    try {
        const adminId = req.user.id; // From auth middleware

        const {
            title,
            message,
            type,
            priority,
            targetAudience,
            targetUserIds,
            targetConditions,
            imageUrl,
            actionType,
            actionData,
            scheduledAt,
            expiresAt
        } = req.body;

        // Validate required fields
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const notificationId = await notificationService.createNotification({
            title,
            message,
            type,
            priority,
            targetAudience,
            targetUserIds,
            targetConditions,
            imageUrl,
            actionType,
            actionData,
            scheduledAt,
            expiresAt,
            createdBy: adminId
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notificationId
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create notification'
        });
    }
};

/**
 * Get all notifications with filters
 * GET /api/admin/notifications
 */
exports.getAllNotifications = async (req, res) => {
    try {
        const {
            type,
            priority,
            targetAudience,
            sent,
            limit = 50,
            offset = 0
        } = req.query;

        const notifications = await notificationService.getAllNotifications({
            type,
            priority,
            targetAudience,
            sent: sent === 'true' ? true : sent === 'false' ? false : null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notifications'
        });
    }
};

/**
 * Get notification by ID
 * GET /api/admin/notifications/:id
 */
exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await notificationService.getNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Get notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notification'
        });
    }
};

/**
 * Update a notification
 * PUT /api/admin/notifications/:id
 */
exports.updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await notificationService.updateNotification(id, updateData);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            message: 'Notification updated successfully'
        });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update notification'
        });
    }
};

/**
 * Delete a notification
 * DELETE /api/admin/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await notificationService.deleteNotification(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete notification'
        });
    }
};

/**
 * Send a notification immediately
 * POST /api/admin/notifications/:id/send
 */
exports.sendNotification = async (req, res) => {
    try {
        const { id } = req.params;

        // Get notification
        const notification = await notificationService.getNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.sent_at) {
            return res.status(400).json({
                success: false,
                message: 'Notification already sent'
            });
        }

        // Use dispatcher service to send notification
        const dispatcherService = require('../../services/notificationDispatcher.service');
        const result = await dispatcherService.dispatchNotification(id);

        res.json({
            success: true,
            message: 'Notification sent successfully',
            ...result
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send notification'
        });
    }
};

/**
 * Get notification statistics
 * GET /api/admin/notifications/:id/stats
 */
exports.getNotificationStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await notificationService.getNotificationStats(id);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch stats'
        });
    }
};

/**
 * Preview target user count (before sending)
 * POST /api/admin/notifications/preview-count
 */
exports.previewTargetCount = async (req, res) => {
    try {
        const { targetAudience, targetUserIds, targetConditions } = req.body;
        const { promisePool } = require('../../config/database');

        let count = 0;

        if (targetAudience === 'all') {
            // All users + guests (estimate based on device tokens)
            const [result] = await promisePool.execute(
                'SELECT COUNT(*) as count FROM user_device_tokens WHERE is_active = TRUE'
            );
            count = result[0].count;
        } else if (targetAudience === 'all_users') {
            const [result] = await promisePool.execute(
                'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'
            );
            count = result[0].count;
        } else if (targetAudience === 'all_guests') {
            const [result] = await promisePool.execute(
                'SELECT COUNT(*) as count FROM user_device_tokens WHERE user_id IS NULL AND is_active = TRUE'
            );
            count = result[0].count;
        } else if (targetAudience === 'specific_users') {
            count = targetUserIds ? targetUserIds.length : 0;
        } else if (targetAudience === 'condition') {
            const userIds = await notificationService.getUserIdsByConditions(targetConditions);
            count = userIds.length;
        }

        res.json({
            success: true,
            estimatedRecipients: count
        });
    } catch (error) {
        console.error('Preview target count error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to preview count'
        });
    }
};
