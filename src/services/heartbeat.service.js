/**
 * Heartbeat Service
 * 
 * Manages heartbeat polling for real-time notification delivery.
 * Tracks when users/guests last checked for notifications and returns new ones.
 * Supports both authenticated users and guest users.
 */

const { promisePool } = require('../config/database');
const userNotificationService = require('./userNotification.service');

/**
 * Update heartbeat log for a user or guest
 * 
 * @param {number|null} userId - User ID (null for guests)
 * @param {string|null} deviceId - Device ID (for guests)
 * @returns {Promise<Object>} Result with success status
 */
async function updateHeartbeat(userId = null, deviceId = null) {
    try {
        if (!userId && !deviceId) {
            throw new Error('Either userId or deviceId is required');
        }

        // Insert or update heartbeat log
        await promisePool.execute(
            `INSERT INTO notification_heartbeat_log (user_id, device_id, last_check_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_check_at = NOW()`,
            [userId, deviceId]
        );

        return {
            success: true,
            message: 'Heartbeat updated'
        };
    } catch (error) {
        console.error('Update heartbeat error:', error);
        throw error;
    }
}

/**
 * Get last heartbeat check time for a user or guest
 * 
 * @param {number|null} userId - User ID (null for guests)
 * @param {string|null} deviceId - Device ID (for guests)
 * @returns {Promise<Date|null>} Last check timestamp or null if never checked
 */
async function getLastHeartbeat(userId = null, deviceId = null) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT last_check_at
       FROM notification_heartbeat_log
       WHERE (user_id = ? OR (user_id IS NULL AND device_id = ?))
       LIMIT 1`,
            [userId, deviceId]
        );

        return rows.length > 0 ? rows[0].last_check_at : null;
    } catch (error) {
        console.error('Get last heartbeat error:', error);
        throw error;
    }
}

/**
 * Check for new notifications (for authenticated users)
 * 
 * @param {number} userId - User ID
 * @param {Date} [lastCheckAt] - Last check timestamp (optional)
 * @returns {Promise<Object>} Object with hasNew flag and notifications array
 */
async function checkForNewNotifications(userId, lastCheckAt = null) {
    try {
        // Get last check time if not provided
        if (!lastCheckAt) {
            lastCheckAt = await getLastHeartbeat(userId, null);
        }

        // If no last check, use 1 hour ago as default
        if (!lastCheckAt) {
            lastCheckAt = new Date(Date.now() - 60 * 60 * 1000);
        }

        // AUTO-PROCESS PENDING CAMPAIGN TRIGGERS FOR THIS USER
        const campaignTriggerService = require('./campaignTrigger.service');
        const [pendingTriggers] = await promisePool.execute(
            `SELECT id FROM campaign_notification_triggers 
             WHERE user_id = ? AND trigger_status = 'pending' 
             AND scheduled_at <= NOW()`,
            [userId]
        );

        if (pendingTriggers.length > 0) {
            console.log(`⚡ Auto-processing ${pendingTriggers.length} pending trigger(s) for user ${userId}`);
            for (const trigger of pendingTriggers) {
                try {
                    await campaignTriggerService.processTrigger(trigger.id);
                } catch (error) {
                    console.error(`Failed to auto-process trigger ${trigger.id}:`, error.message);
                }
            }
        }

        // Get new notifications since last check
        const notifications = await userNotificationService.getNewNotificationsSinceLastCheck(
            userId,
            lastCheckAt
        );

        // Get new campaign notifications since last check
        const [campaignNotifications] = await promisePool.execute(
            `SELECT 
                ucn.*,
                cn.*,
                ucn.id as user_notification_id
            FROM user_campaign_notifications ucn
            JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
            WHERE ucn.user_id = ?
            AND ucn.delivered_at > ?
            AND cn.is_active = TRUE
            ORDER BY ucn.delivered_at DESC`,
            [userId, lastCheckAt]
        );

        // Parse JSON fields in campaign notifications
        const parsedCampaignNotifications = campaignNotifications.map(notification => {
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

        // Update heartbeat
        await updateHeartbeat(userId, null);

        return {
            hasNew: notifications.length > 0 || campaignNotifications.length > 0,
            count: notifications.length + campaignNotifications.length,
            notifications: notifications,
            campaignNotifications: parsedCampaignNotifications,
            lastCheckAt: new Date()
        };
    } catch (error) {
        console.error('Check for new notifications error:', error);
        throw error;
    }
}

/**
 * Check for new notifications for guests
 * Returns notifications targeted to all guests or all users
 * 
 * @param {string} deviceId - Device ID
 * @param {Date} [lastCheckAt] - Last check timestamp (optional)
 * @returns {Promise<Object>} Object with hasNew flag and notifications array
 */
async function checkForNewNotificationsGuest(deviceId, lastCheckAt = null) {
    try {
        // Get last check time if not provided
        if (!lastCheckAt) {
            lastCheckAt = await getLastHeartbeat(null, deviceId);
        }

        // If no last check, use 1 hour ago as default
        if (!lastCheckAt) {
            lastCheckAt = new Date(Date.now() - 60 * 60 * 1000);
        }

        // Get notifications for guests (sent after last check)
        const [rows] = await promisePool.execute(
            `SELECT 
        n.id as notification_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.image_url,
        n.action_type,
        n.action_data,
        n.sent_at
       FROM notifications n
       WHERE n.is_active = TRUE
       AND n.sent_at IS NOT NULL
       AND n.sent_at > ?
       AND n.target_audience IN ('all', 'all_guests')
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       AND n.type IN ('popup', 'fullscreen')
       ORDER BY n.sent_at DESC`,
            [lastCheckAt]
        );

        // Parse JSON fields
        const notifications = rows.map(row => {
            if (row.action_data) {
                row.action_data = JSON.parse(row.action_data);
            }
            return row;
        });

        // Update heartbeat
        await updateHeartbeat(null, deviceId);

        return {
            hasNew: notifications.length > 0,
            count: notifications.length,
            notifications: notifications,
            lastCheckAt: new Date()
        };
    } catch (error) {
        console.error('Check for new notifications (guest) error:', error);
        throw error;
    }
}

/**
 * Clean up old heartbeat logs (older than 30 days)
 * 
 * @returns {Promise<Object>} Result with count of deleted records
 */
async function cleanupOldHeartbeats() {
    try {
        const [result] = await promisePool.execute(
            `DELETE FROM notification_heartbeat_log
       WHERE last_check_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        return {
            success: true,
            deletedCount: result.affectedRows,
            message: `Cleaned up ${result.affectedRows} old heartbeat records`
        };
    } catch (error) {
        console.error('Cleanup old heartbeats error:', error);
        throw error;
    }
}

/**
 * Get heartbeat statistics
 * 
 * @returns {Promise<Object>} Heartbeat stats
 */
async function getHeartbeatStats() {
    try {
        const [stats] = await promisePool.execute(
            `SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as logged_in_users,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_devices,
        SUM(CASE WHEN last_check_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) as active_last_5min,
        SUM(CASE WHEN last_check_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) as active_last_hour,
        SUM(CASE WHEN last_check_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as active_last_24h
       FROM notification_heartbeat_log`
        );

        return stats[0];
    } catch (error) {
        console.error('Get heartbeat stats error:', error);
        throw error;
    }
}

module.exports = {
    updateHeartbeat,
    getLastHeartbeat,
    checkForNewNotifications,
    checkForNewNotificationsGuest,
    cleanupOldHeartbeats,
    getHeartbeatStats
};
