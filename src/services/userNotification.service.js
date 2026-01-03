/**
 * User Notification Service
 * 
 * Manages user-specific notification delivery, read status, and engagement tracking.
 * Handles notifications for logged-in users only (not guests).
 */

const { promisePool } = require('../config/database');

/**
 * Create user notification records for multiple users
 * 
 * @param {number} notificationId - Notification ID
 * @param {Array<number>} userIds - Array of user IDs
 * @returns {Promise<Object>} Result with count of created records
 */
async function createUserNotifications(notificationId, userIds) {
    try {
        if (!userIds || userIds.length === 0) {
            return { success: true, count: 0, message: 'No users to notify' };
        }

        // Build bulk insert query
        const values = userIds.map(userId => `(${notificationId}, ${userId})`).join(',');

        const [result] = await promisePool.execute(
            `INSERT IGNORE INTO user_notifications (notification_id, user_id)
       VALUES ${values}`
        );

        return {
            success: true,
            count: result.affectedRows,
            message: `Created ${result.affectedRows} user notification records`
        };
    } catch (error) {
        console.error('Create user notifications error:', error);
        throw error;
    }
}

/**
 * Get notifications for a specific user with pagination
 * 
 * @param {number} userId - User ID
 * @param {number} [limit] - Limit results (default 50)
 * @param {number} [offset] - Offset for pagination (default 0)
 * @returns {Promise<Array>} Array of notifications with read status
 */
async function getUserNotifications(userId, limit = 50, offset = 0) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT 
        un.id as user_notification_id,
        un.is_read,
        un.is_clicked,
        un.delivered_at,
        un.read_at,
        un.clicked_at,
        n.id as notification_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.image_url,
        n.action_type,
        n.action_data,
        n.created_at
       FROM user_notifications un
       JOIN notifications n ON un.notification_id = n.id
       WHERE un.user_id = ? 
       AND n.is_active = TRUE
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       ORDER BY un.delivered_at DESC
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Parse JSON fields
        return rows.map(row => {
            if (row.action_data) {
                row.action_data = JSON.parse(row.action_data);
            }
            return row;
        });
    } catch (error) {
        console.error('Get user notifications error:', error);
        throw error;
    }
}

/**
 * Get unread notification count for a user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT COUNT(*) as count
       FROM user_notifications un
       JOIN notifications n ON un.notification_id = n.id
       WHERE un.user_id = ? 
       AND un.is_read = FALSE
       AND n.is_active = TRUE
       AND (n.expires_at IS NULL OR n.expires_at > NOW())`,
            [userId]
        );

        return rows[0].count;
    } catch (error) {
        console.error('Get unread count error:', error);
        throw error;
    }
}

/**
 * Mark a notification as read for a user
 * 
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Result with success status
 */
async function markAsRead(userId, notificationId) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE user_notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = ? AND notification_id = ? AND is_read = FALSE`,
            [userId, notificationId]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Notification marked as read'
                : 'Notification already read or not found'
        };
    } catch (error) {
        console.error('Mark as read error:', error);
        throw error;
    }
}

/**
 * Mark a notification as clicked for a user
 * 
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Result with success status
 */
async function markAsClicked(userId, notificationId) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE user_notifications
       SET is_clicked = TRUE, clicked_at = NOW(), is_read = TRUE, read_at = COALESCE(read_at, NOW())
       WHERE user_id = ? AND notification_id = ?`,
            [userId, notificationId]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Notification marked as clicked'
                : 'Notification not found'
        };
    } catch (error) {
        console.error('Mark as clicked error:', error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Result with count of updated notifications
 */
async function markAllAsRead(userId) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE user_notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        return {
            success: true,
            count: result.affectedRows,
            message: `Marked ${result.affectedRows} notifications as read`
        };
    } catch (error) {
        console.error('Mark all as read error:', error);
        throw error;
    }
}

/**
 * Delete a user notification
 * 
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Result with success status
 */
async function deleteUserNotification(userId, notificationId) {
    try {
        const [result] = await promisePool.execute(
            `DELETE FROM user_notifications
       WHERE user_id = ? AND notification_id = ?`,
            [userId, notificationId]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Notification deleted'
                : 'Notification not found'
        };
    } catch (error) {
        console.error('Delete user notification error:', error);
        throw error;
    }
}

/**
 * Get new notifications since last check (for heartbeat polling)
 * 
 * @param {number} userId - User ID
 * @param {Date} lastCheckAt - Last check timestamp
 * @returns {Promise<Array>} Array of new notifications
 */
async function getNewNotificationsSinceLastCheck(userId, lastCheckAt) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT 
        un.id as user_notification_id,
        n.id as notification_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.image_url,
        n.action_type,
        n.action_data
       FROM user_notifications un
       JOIN notifications n ON un.notification_id = n.id
       WHERE un.user_id = ? 
       AND un.delivered_at > ?
       AND n.is_active = TRUE
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       AND n.type IN ('popup', 'fullscreen')
       ORDER BY un.delivered_at DESC`,
            [userId, lastCheckAt]
        );

        // Parse JSON fields
        return rows.map(row => {
            if (row.action_data) {
                row.action_data = JSON.parse(row.action_data);
            }
            return row;
        });
    } catch (error) {
        console.error('Get new notifications since last check error:', error);
        throw error;
    }
}

module.exports = {
    createUserNotifications,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAsClicked,
    markAllAsRead,
    deleteUserNotification,
    getNewNotificationsSinceLastCheck
};
