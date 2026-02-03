/**
 * Mobile App Campaign Notification Controller
 * Handles campaign notification delivery to mobile app users
 */

const campaignNotificationService = require('../../services/campaignNotification.service');
const { promisePool } = require('../../config/database');

/**
 * Get campaign notifications for current user
 * GET /api/v1/mobile-app/campaign-notifications
 */
exports.getCampaignNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await promisePool.execute(
            `SELECT 
                ucn.*,
                cn.*,
                ucn.id as user_notification_id
            FROM user_campaign_notifications ucn
            JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
            WHERE ucn.user_id = ?
            AND cn.is_active = TRUE
            ORDER BY ucn.delivered_at DESC
            LIMIT 50`,
            [userId]
        );

        // Parse JSON fields
        const parsedNotifications = notifications.map(notification => {
            const jsonFields = [
                'expanded_button_1_action', 'expanded_button_2_action',
                'fullscreen_primary_button_action', 'fullscreen_secondary_button_action'
            ];
            for (const field of jsonFields) {
                if (notification[field]) {
                    try {
                        notification[field] = JSON.parse(notification[field]);
                    } catch (e) {
                        console.error(`Failed to parse ${field}:`, e);
                    }
                }
            }
            return notification;
        });

        res.json({
            success: true,
            notifications: parsedNotifications
        });
    } catch (error) {
        console.error('Get campaign notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch campaign notifications'
        });
    }
};

/**
 * Mark campaign notification as read
 * POST /api/v1/mobile-app/campaign-notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await promisePool.execute(
            `UPDATE user_campaign_notifications 
            SET is_read = TRUE, read_at = NOW() 
            WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark notification as read'
        });
    }
};

/**
 * Mark campaign notification as clicked
 * POST /api/v1/mobile-app/campaign-notifications/:id/click
 */
exports.markAsClicked = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { button_clicked } = req.body;

        const [result] = await promisePool.execute(
            `UPDATE user_campaign_notifications 
            SET is_clicked = TRUE, clicked_at = NOW(), button_clicked = ? 
            WHERE id = ? AND user_id = ?`,
            [button_clicked, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as clicked'
        });
    } catch (error) {
        console.error('Mark as clicked error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark notification as clicked'
        });
    }
};

/**
 * Dismiss campaign notification
 * POST /api/v1/mobile-app/campaign-notifications/:id/dismiss
 */
exports.dismissNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await promisePool.execute(
            `UPDATE user_campaign_notifications 
            SET is_dismissed = TRUE, dismissed_at = NOW() 
            WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification dismissed'
        });
    } catch (error) {
        console.error('Dismiss notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to dismiss notification'
        });
    }
};

/**
 * Get campaign notification statistics for user
 * GET /api/v1/mobile-app/campaign-notifications/stats
 */
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [stats] = await promisePool.execute(
            `SELECT 
                COUNT(*) as total_received,
                SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) as clicked_count,
                SUM(CASE WHEN is_dismissed = TRUE THEN 1 ELSE 0 END) as dismissed_count
            FROM user_campaign_notifications
            WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch statistics'
        });
    }
};
