/**
 * Notification Service
 * 
 * Manages notifications with advanced targeting, conditions, and scheduling.
 * Supports targeting all users, specific users, guests, and condition-based targeting.
 */

const { promisePool } = require('../config/database');

/**
 * Create a new notification
 * 
 * @param {Object} data - Notification data
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - 'push', 'popup', or 'fullscreen'
 * @param {string} data.priority - 'low', 'medium', or 'high'
 * @param {string} data.targetAudience - 'all', 'all_users', 'all_guests', 'specific_users', 'condition'
 * @param {Array} [data.targetUserIds] - Array of user IDs (for specific_users)
 * @param {Object} [data.targetConditions] - Conditions object (for condition)
 * @param {string} [data.imageUrl] - Optional image URL
 * @param {string} [data.actionType] - 'none', 'open_url', 'open_screen', 'custom'
 * @param {Object} [data.actionData] - Action data object
 * @param {Date} [data.scheduledAt] - When to send (null for immediate)
 * @param {Date} [data.expiresAt] - When notification expires
 * @param {number} data.createdBy - Admin user ID
 * @returns {Promise<number>} Notification ID
 */
async function createNotification(data) {
    const {
        title,
        message,
        type = 'push',
        priority = 'medium',
        targetAudience = 'all',
        targetUserIds = null,
        targetConditions = null,
        imageUrl = null,
        actionType = 'none',
        actionData = null,
        scheduledAt = null,
        expiresAt = null,
        createdBy
    } = data;

    try {
        // Validate required fields
        if (!title || !message || !createdBy) {
            throw new Error('Title, message, and createdBy are required');
        }

        // Convert arrays/objects to JSON strings
        const targetUserIdsJson = targetUserIds ? JSON.stringify(targetUserIds) : null;
        const targetConditionsJson = targetConditions ? JSON.stringify(targetConditions) : null;
        const actionDataJson = actionData ? JSON.stringify(actionData) : null;

        const [result] = await promisePool.execute(
            `INSERT INTO notifications 
        (title, message, type, priority, target_audience, target_user_ids, target_conditions,
         image_url, action_type, action_data, scheduled_at, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, message, type, priority, targetAudience, targetUserIdsJson, targetConditionsJson,
                imageUrl, actionType, actionDataJson, scheduledAt, expiresAt, createdBy
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
}

/**
 * Get notification by ID
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object|null>} Notification object or null
 */
async function getNotificationById(id) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT * FROM notifications WHERE id = ? AND is_active = TRUE`,
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        const notification = rows[0];

        // Parse JSON fields
        if (notification.target_user_ids) {
            notification.target_user_ids = JSON.parse(notification.target_user_ids);
        }
        if (notification.target_conditions) {
            notification.target_conditions = JSON.parse(notification.target_conditions);
        }
        if (notification.action_data) {
            notification.action_data = JSON.parse(notification.action_data);
        }

        return notification;
    } catch (error) {
        console.error('Get notification by ID error:', error);
        throw error;
    }
}

/**
 * Get all notifications with pagination and filters
 * 
 * @param {Object} filters - Filter options
 * @param {string} [filters.type] - Filter by type
 * @param {string} [filters.priority] - Filter by priority
 * @param {string} [filters.targetAudience] - Filter by target audience
 * @param {boolean} [filters.sent] - Filter by sent status (true/false/null for all)
 * @param {number} [filters.limit] - Limit results (default 50)
 * @param {number} [filters.offset] - Offset for pagination (default 0)
 * @returns {Promise<Array>} Array of notifications
 */
async function getAllNotifications(filters = {}) {
    const {
        type,
        priority,
        targetAudience,
        sent,
        limit = 50,
        offset = 0
    } = filters;

    try {
        let query = 'SELECT * FROM notifications WHERE is_active = TRUE';
        const params = [];

        // Add filters
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }
        if (targetAudience) {
            query += ' AND target_audience = ?';
            params.push(targetAudience);
        }
        if (sent === true) {
            query += ' AND sent_at IS NOT NULL';
        } else if (sent === false) {
            query += ' AND sent_at IS NULL';
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await promisePool.execute(query, params);

        // Parse JSON fields for each notification
        return rows.map(notification => {
            if (notification.target_user_ids) {
                notification.target_user_ids = JSON.parse(notification.target_user_ids);
            }
            if (notification.target_conditions) {
                notification.target_conditions = JSON.parse(notification.target_conditions);
            }
            if (notification.action_data) {
                notification.action_data = JSON.parse(notification.action_data);
            }
            return notification;
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        throw error;
    }
}

/**
 * Update a notification
 * 
 * @param {number} id - Notification ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Result with success status
 */
async function updateNotification(id, data) {
    try {
        const updates = [];
        const params = [];

        // Build dynamic update query
        const allowedFields = [
            'title', 'message', 'type', 'priority', 'target_audience',
            'image_url', 'action_type', 'scheduled_at', 'expires_at'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        // Handle JSON fields
        if (data.targetUserIds !== undefined) {
            updates.push('target_user_ids = ?');
            params.push(JSON.stringify(data.targetUserIds));
        }
        if (data.targetConditions !== undefined) {
            updates.push('target_conditions = ?');
            params.push(JSON.stringify(data.targetConditions));
        }
        if (data.actionData !== undefined) {
            updates.push('action_data = ?');
            params.push(JSON.stringify(data.actionData));
        }

        // Handle sent_at
        if (data.sentAt !== undefined) {
            updates.push('sent_at = ?');
            params.push(data.sentAt);
        }

        if (updates.length === 0) {
            return { success: false, message: 'No fields to update' };
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const [result] = await promisePool.execute(
            `UPDATE notifications SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Notification updated' : 'Notification not found'
        };
    } catch (error) {
        console.error('Update notification error:', error);
        throw error;
    }
}

/**
 * Delete a notification (soft delete)
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Result with success status
 */
async function deleteNotification(id) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE notifications SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [id]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Notification deleted' : 'Notification not found'
        };
    } catch (error) {
        console.error('Delete notification error:', error);
        throw error;
    }
}

/**
 * Get scheduled notifications that are ready to send
 * 
 * @returns {Promise<Array>} Array of notifications ready to send
 */
async function getScheduledNotifications() {
    try {
        const [rows] = await promisePool.execute(
            `SELECT * FROM notifications
       WHERE is_active = TRUE
       AND scheduled_at <= NOW()
       AND sent_at IS NULL
       ORDER BY scheduled_at ASC`
        );

        // Parse JSON fields
        return rows.map(notification => {
            if (notification.target_user_ids) {
                notification.target_user_ids = JSON.parse(notification.target_user_ids);
            }
            if (notification.target_conditions) {
                notification.target_conditions = JSON.parse(notification.target_conditions);
            }
            if (notification.action_data) {
                notification.action_data = JSON.parse(notification.action_data);
            }
            return notification;
        });
    } catch (error) {
        console.error('Get scheduled notifications error:', error);
        throw error;
    }
}

/**
 * Get notification stats (delivery, read, click rates)
 * 
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Stats object
 */
async function getNotificationStats(id) {
    try {
        const [stats] = await promisePool.execute(
            `SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) as clicked_count
       FROM user_notifications
       WHERE notification_id = ?`,
            [id]
        );

        const result = stats[0];
        const totalSent = result.total_sent || 0;
        const readCount = result.read_count || 0;
        const clickedCount = result.clicked_count || 0;

        return {
            total_sent: totalSent,
            delivered_count: totalSent, // All sent are delivered
            read_count: readCount,
            clicked_count: clickedCount,
            delivery_rate: 100, // Always 100% for sent notifications
            read_rate: totalSent > 0 ? ((readCount / totalSent) * 100).toFixed(2) : 0,
            click_through_rate: readCount > 0 ? ((clickedCount / readCount) * 100).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Get notification stats error:', error);
        throw error;
    }
}

/**
 * Get target user IDs based on conditions
 * 
 * @param {Object} conditions - Targeting conditions
 * @returns {Promise<Array>} Array of user IDs
 */
async function getUserIdsByConditions(conditions) {
    try {
        let query = 'SELECT id FROM users WHERE is_active = TRUE';
        const params = [];

        // Subscription plan filter
        if (conditions.subscription_plan && Array.isArray(conditions.subscription_plan)) {
            const placeholders = conditions.subscription_plan.map(() => '?').join(',');
            query += ` AND subscription_plan_id IN (${placeholders})`;
            params.push(...conditions.subscription_plan);
        }

        // Country filter
        if (conditions.country_code && Array.isArray(conditions.country_code)) {
            const placeholders = conditions.country_code.map(() => '?').join(',');
            query += ` AND country_code IN (${placeholders})`;
            params.push(...conditions.country_code);
        }

        // Verified users filter
        if (conditions.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(conditions.is_verified);
        }

        // Created after date filter
        if (conditions.created_after) {
            query += ' AND created_at >= ?';
            params.push(conditions.created_after);
        }

        // Created before date filter
        if (conditions.created_before) {
            query += ' AND created_at <= ?';
            params.push(conditions.created_before);
        }

        const [rows] = await promisePool.execute(query, params);
        return rows.map(row => row.id);
    } catch (error) {
        console.error('Get user IDs by conditions error:', error);
        throw error;
    }
}

module.exports = {
    createNotification,
    getNotificationById,
    getAllNotifications,
    updateNotification,
    deleteNotification,
    getScheduledNotifications,
    getNotificationStats,
    getUserIdsByConditions
};
