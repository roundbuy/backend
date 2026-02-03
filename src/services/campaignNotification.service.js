/**
 * Campaign Notification Service
 * Manages campaign notification CRUD operations
 */

const { promisePool } = require('../config/database');

/**
 * Get all campaign notifications
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of campaign notifications
 */
async function getAllCampaignNotifications(filters = {}) {
    const {
        category,
        priority,
        trigger_type,
        is_active,
        limit = 100,
        offset = 0
    } = filters;

    try {
        let query = 'SELECT * FROM campaign_notifications WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }
        if (trigger_type) {
            query += ' AND trigger_type = ?';
            params.push(trigger_type);
        }
        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(is_active);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await promisePool.execute(query, params);

        // Parse JSON fields
        return rows.map(notification => parseNotificationJSON(notification));
    } catch (error) {
        console.error('Get all campaign notifications error:', error);
        throw error;
    }
}

/**
 * Get campaign notification by ID
 * @param {number} id - Notification ID
 * @returns {Promise<Object|null>} Notification object or null
 */
async function getCampaignNotificationById(id) {
    try {
        const [rows] = await promisePool.execute(
            'SELECT * FROM campaign_notifications WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        return parseNotificationJSON(rows[0]);
    } catch (error) {
        console.error('Get campaign notification by ID error:', error);
        throw error;
    }
}

/**
 * Get campaign notification by type key
 * @param {string} typeKey - Notification type key
 * @returns {Promise<Object|null>} Notification object or null
 */
async function getCampaignNotificationByTypeKey(typeKey) {
    try {
        const [rows] = await promisePool.execute(
            'SELECT * FROM campaign_notifications WHERE type_key = ?',
            [typeKey]
        );

        if (rows.length === 0) {
            return null;
        }

        return parseNotificationJSON(rows[0]);
    } catch (error) {
        console.error('Get campaign notification by type key error:', error);
        throw error;
    }
}

/**
 * Update campaign notification
 * @param {number} id - Notification ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Result with success status
 */
async function updateCampaignNotification(id, data) {
    try {
        const updates = [];
        const params = [];

        // Define allowed fields
        const allowedFields = [
            'category', 'priority', 'is_active',
            'collapsed_icon', 'collapsed_icon_bg_color', 'collapsed_title', 'collapsed_message', 'collapsed_timestamp_text',
            'expanded_icon', 'expanded_icon_bg_color', 'expanded_title', 'expanded_message',
            'expanded_button_1_text', 'expanded_button_1_color',
            'expanded_button_2_text', 'expanded_button_2_color',
            'fullscreen_show_logo', 'fullscreen_icon', 'fullscreen_icon_bg_color',
            'fullscreen_heading', 'fullscreen_subheading', 'fullscreen_description',
            'fullscreen_primary_button_text', 'fullscreen_primary_button_color',
            'fullscreen_secondary_button_text', 'fullscreen_secondary_button_color',
            'trigger_type'
        ];

        // Build update query
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        // Handle JSON fields
        const jsonFields = [
            'expanded_button_1_action', 'expanded_button_2_action',
            'fullscreen_primary_button_action', 'fullscreen_secondary_button_action',
            'trigger_conditions'
        ];

        for (const field of jsonFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(JSON.stringify(data[field]));
            }
        }

        if (updates.length === 0) {
            return { success: false, message: 'No fields to update' };
        }

        params.push(id);

        const [result] = await promisePool.execute(
            `UPDATE campaign_notifications SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Notification updated' : 'Notification not found'
        };
    } catch (error) {
        console.error('Update campaign notification error:', error);
        throw error;
    }
}

/**
 * Toggle campaign notification active status
 * @param {number} id - Notification ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Result with success status
 */
async function toggleCampaignNotification(id, isActive) {
    try {
        const [result] = await promisePool.execute(
            'UPDATE campaign_notifications SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [isActive, id]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Notification toggled' : 'Notification not found'
        };
    } catch (error) {
        console.error('Toggle campaign notification error:', error);
        throw error;
    }
}

/**
 * Get campaign notification statistics
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} Statistics object
 */
async function getCampaignNotificationStats(id) {
    try {
        const [stats] = await promisePool.execute(
            `SELECT 
                COUNT(*) as total_sent,
                SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN is_clicked = TRUE THEN 1 ELSE 0 END) as clicked_count,
                SUM(CASE WHEN is_dismissed = TRUE THEN 1 ELSE 0 END) as dismissed_count
            FROM user_campaign_notifications
            WHERE campaign_notification_id = ?`,
            [id]
        );

        const result = stats[0];
        const totalSent = result.total_sent || 0;
        const readCount = result.read_count || 0;
        const clickedCount = result.clicked_count || 0;
        const dismissedCount = result.dismissed_count || 0;

        return {
            total_sent: totalSent,
            read_count: readCount,
            clicked_count: clickedCount,
            dismissed_count: dismissedCount,
            read_rate: totalSent > 0 ? ((readCount / totalSent) * 100).toFixed(2) : 0,
            click_through_rate: readCount > 0 ? ((clickedCount / readCount) * 100).toFixed(2) : 0,
            dismiss_rate: totalSent > 0 ? ((dismissedCount / totalSent) * 100).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Get campaign notification stats error:', error);
        throw error;
    }
}

/**
 * Parse JSON fields in notification object
 * @param {Object} notification - Notification object
 * @returns {Object} Parsed notification object
 */
function parseNotificationJSON(notification) {
    const jsonFields = [
        'expanded_button_1_action', 'expanded_button_2_action',
        'fullscreen_primary_button_action', 'fullscreen_secondary_button_action',
        'trigger_conditions'
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
}

module.exports = {
    getAllCampaignNotifications,
    getCampaignNotificationById,
    getCampaignNotificationByTypeKey,
    updateCampaignNotification,
    toggleCampaignNotification,
    getCampaignNotificationStats
};
