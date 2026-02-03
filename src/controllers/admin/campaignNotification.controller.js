/**
 * Admin Campaign Notification Controller
 * Handles admin operations for campaign notifications
 */

const campaignNotificationService = require('../../services/campaignNotification.service');
const campaignTriggerService = require('../../services/campaignTrigger.service');
const { promisePool } = require('../../config/database');

/**
 * Get all campaign notifications
 * GET /api/admin/campaign-notifications
 */
exports.getAllCampaignNotifications = async (req, res) => {
    try {
        const { category, priority, trigger_type, is_active, limit, offset } = req.query;

        const notifications = await campaignNotificationService.getAllCampaignNotifications({
            category,
            priority,
            trigger_type,
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });

        res.json({
            success: true,
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Get all campaign notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch campaign notifications'
        });
    }
};

/**
 * Get campaign notification by ID
 * GET /api/admin/campaign-notifications/:id
 */
exports.getCampaignNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await campaignNotificationService.getCampaignNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Campaign notification not found'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Get campaign notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch campaign notification'
        });
    }
};

/**
 * Update campaign notification
 * PUT /api/admin/campaign-notifications/:id
 */
exports.updateCampaignNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await campaignNotificationService.updateCampaignNotification(id, updateData);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            message: 'Campaign notification updated successfully'
        });
    } catch (error) {
        console.error('Update campaign notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update campaign notification'
        });
    }
};

/**
 * Toggle campaign notification active status
 * POST /api/admin/campaign-notifications/:id/toggle
 */
exports.toggleCampaignNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await campaignNotificationService.toggleCampaignNotification(id, is_active);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            message: `Campaign notification ${is_active ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Toggle campaign notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle campaign notification'
        });
    }
};

/**
 * Send campaign notification to all eligible users
 * POST /api/admin/campaign-notifications/:id/send
 */
exports.sendCampaignNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_at } = req.body;
        const adminId = req.user.id;

        const notification = await campaignNotificationService.getCampaignNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Campaign notification not found'
            });
        }

        // Get all active users
        const [users] = await promisePool.execute(
            'SELECT id FROM users WHERE is_active = TRUE'
        );

        const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date();
        let scheduled = 0;

        for (const user of users) {
            await campaignTriggerService.scheduleCampaignNotification(
                user.id,
                id,
                scheduledDate,
                { createdBy: adminId }
            );
            scheduled++;
        }

        res.json({
            success: true,
            message: scheduled_at
                ? `Campaign notification scheduled for ${users.length} users`
                : `Campaign notification sent to ${users.length} users`,
            recipients: users.length,
            scheduled_at: scheduledDate
        });
    } catch (error) {
        console.error('Send campaign notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send campaign notification'
        });
    }
};

/**
 * Send campaign notification to specific user(s)
 * POST /api/admin/campaign-notifications/:id/send-to-user
 */
exports.sendToSpecificUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_ids, scheduled_at } = req.body;
        const adminId = req.user.id;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'user_ids array is required'
            });
        }

        const notification = await campaignNotificationService.getCampaignNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Campaign notification not found'
            });
        }

        const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date();
        let scheduled = 0;

        for (const userId of user_ids) {
            await campaignTriggerService.scheduleCampaignNotification(
                userId,
                id,
                scheduledDate,
                { createdBy: adminId }
            );
            scheduled++;
        }

        res.json({
            success: true,
            message: scheduled_at
                ? `Campaign notification scheduled for ${scheduled} users`
                : `Campaign notification sent to ${scheduled} users`,
            recipients: scheduled,
            scheduled_at: scheduledDate
        });
    } catch (error) {
        console.error('Send to specific users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send campaign notification'
        });
    }
};

/**
 * Send campaign notification to user group
 * POST /api/admin/campaign-notifications/:id/send-to-group
 */
exports.sendToUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { filters, scheduled_at, is_recurring, recurrence_pattern } = req.body;
        const adminId = req.user.id;

        const notification = await campaignNotificationService.getCampaignNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Campaign notification not found'
            });
        }

        // Build query based on filters
        let query = 'SELECT id FROM users WHERE is_active = TRUE';
        const params = [];

        if (filters.subscription_plan_id) {
            query += ' AND subscription_plan_id = ?';
            params.push(filters.subscription_plan_id);
        }
        if (filters.country_code) {
            query += ' AND country_code = ?';
            params.push(filters.country_code);
        }
        if (filters.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(filters.is_verified);
        }
        if (filters.created_after) {
            query += ' AND created_at >= ?';
            params.push(filters.created_after);
        }
        if (filters.created_before) {
            query += ' AND created_at <= ?';
            params.push(filters.created_before);
        }
        if (filters.last_login_after) {
            query += ' AND last_login >= ?';
            params.push(filters.last_login_after);
        }

        const [users] = await promisePool.execute(query, params);

        const scheduledDate = scheduled_at ? new Date(scheduled_at) : new Date();
        let scheduled = 0;

        for (const user of users) {
            await campaignTriggerService.scheduleCampaignNotification(
                user.id,
                id,
                scheduledDate,
                {
                    createdBy: adminId,
                    isRecurring: is_recurring || false,
                    recurrencePattern: recurrence_pattern || null
                }
            );
            scheduled++;
        }

        res.json({
            success: true,
            message: scheduled_at
                ? `Campaign notification scheduled for ${scheduled} users`
                : `Campaign notification sent to ${scheduled} users`,
            recipients: scheduled,
            scheduled_at: scheduledDate,
            is_recurring: is_recurring || false
        });
    } catch (error) {
        console.error('Send to user group error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send campaign notification'
        });
    }
};

/**
 * Test send campaign notification to admin
 * POST /api/admin/campaign-notifications/:id/test
 */
exports.testSendCampaignNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const notification = await campaignNotificationService.getCampaignNotificationById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Campaign notification not found'
            });
        }

        await campaignTriggerService.sendCampaignNotification(adminId, id, adminId);

        res.json({
            success: true,
            message: 'Test notification sent to your account'
        });
    } catch (error) {
        console.error('Test send campaign notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send test notification'
        });
    }
};

/**
 * Get campaign notification statistics
 * GET /api/admin/campaign-notifications/:id/stats
 */
exports.getCampaignNotificationStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await campaignNotificationService.getCampaignNotificationStats(id);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get campaign notification stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch stats'
        });
    }
};

/**
 * Get scheduled sends for a campaign notification
 * GET /api/admin/campaign-notifications/:id/scheduled
 */
exports.getScheduledSends = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        const scheduled = await campaignTriggerService.getScheduledNotifications(id, status);

        res.json({
            success: true,
            scheduled,
            count: scheduled.length
        });
    } catch (error) {
        console.error('Get scheduled sends error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch scheduled sends'
        });
    }
};

/**
 * Cancel scheduled send
 * DELETE /api/admin/campaign-notifications/scheduled/:triggerId
 */
exports.cancelScheduledSend = async (req, res) => {
    try {
        const { triggerId } = req.params;

        const result = await campaignTriggerService.cancelScheduledNotification(triggerId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            message: 'Scheduled notification cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel scheduled send error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel scheduled send'
        });
    }
};

/**
 * Preview recipient count
 * POST /api/admin/campaign-notifications/preview-count
 */
exports.previewRecipientCount = async (req, res) => {
    try {
        const { filters } = req.body;

        let query = 'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE';
        const params = [];

        if (filters.subscription_plan_id) {
            query += ' AND subscription_plan_id = ?';
            params.push(filters.subscription_plan_id);
        }
        if (filters.country_code) {
            query += ' AND country_code = ?';
            params.push(filters.country_code);
        }
        if (filters.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(filters.is_verified);
        }
        if (filters.created_after) {
            query += ' AND created_at >= ?';
            params.push(filters.created_after);
        }
        if (filters.created_before) {
            query += ' AND created_at <= ?';
            params.push(filters.created_before);
        }

        const [result] = await promisePool.execute(query, params);

        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Preview recipient count error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to preview count'
        });
    }
};

/**
 * Search users
 * GET /api/admin/users/search
 */
exports.searchUsers = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                users: []
            });
        }

        const searchTerm = `%${q}%`;
        const [users] = await promisePool.execute(
            `SELECT id, email, full_name, subscription_plan_id, is_verified
            FROM users
            WHERE (email LIKE ? OR full_name LIKE ? OR id = ?)
            AND is_active = TRUE
            LIMIT ?`,
            [searchTerm, searchTerm, parseInt(q) || 0, parseInt(limit)]
        );

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to search users'
        });
    }
};
