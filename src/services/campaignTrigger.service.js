/**
 * Campaign Trigger Service
 * Handles trigger logic, scheduling, and sending of campaign notifications
 */

const { promisePool } = require('../config/database');
const campaignNotificationService = require('./campaignNotification.service');

/**
 * Schedule a campaign notification for a user
 * @param {number} userId - User ID
 * @param {number} campaignNotificationId - Campaign notification ID
 * @param {Date} scheduledAt - When to send
 * @param {Object} options - Additional options (isRecurring, recurrencePattern, createdBy)
 * @returns {Promise<number>} Trigger ID
 */
async function scheduleCampaignNotification(userId, campaignNotificationId, scheduledAt, options = {}) {
    const {
        isRecurring = false,
        recurrencePattern = null,
        createdBy = null
    } = options;

    try {
        const [result] = await promisePool.execute(
            `INSERT INTO campaign_notification_triggers 
            (campaign_notification_id, user_id, scheduled_at, is_recurring, recurrence_pattern, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [campaignNotificationId, userId, scheduledAt, isRecurring, recurrencePattern, createdBy]
        );

        return result.insertId;
    } catch (error) {
        console.error('Schedule campaign notification error:', error);
        throw error;
    }
}

/**
 * Send campaign notification immediately
 * @param {number} userId - User ID
 * @param {number} campaignNotificationId - Campaign notification ID
 * @param {number} createdBy - Admin ID who triggered (optional)
 * @returns {Promise<Object>} Result with trigger ID
 */
async function sendCampaignNotification(userId, campaignNotificationId, createdBy = null) {
    try {
        // Schedule for immediate send (now)
        const triggerId = await scheduleCampaignNotification(
            userId,
            campaignNotificationId,
            new Date(),
            { createdBy }
        );

        // Process immediately
        await processTrigger(triggerId);

        return { success: true, triggerId };
    } catch (error) {
        console.error('Send campaign notification error:', error);
        throw error;
    }
}

/**
 * Get scheduled notifications for a campaign
 * @param {number} campaignNotificationId - Campaign notification ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of scheduled triggers
 */
async function getScheduledNotifications(campaignNotificationId, status = null) {
    try {
        let query = `
            SELECT t.*, u.email as user_email, u.full_name as user_name
            FROM campaign_notification_triggers t
            JOIN users u ON t.user_id = u.id
            WHERE t.campaign_notification_id = ?
        `;
        const params = [campaignNotificationId];

        if (status) {
            query += ' AND t.trigger_status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.scheduled_at DESC';

        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Get scheduled notifications error:', error);
        throw error;
    }
}

/**
 * Update scheduled notification time
 * @param {number} triggerId - Trigger ID
 * @param {Date} newScheduledAt - New scheduled time
 * @returns {Promise<Object>} Result with success status
 */
async function updateScheduledNotification(triggerId, newScheduledAt) {
    try {
        const [result] = await promisePool.execute(
            'UPDATE campaign_notification_triggers SET scheduled_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trigger_status = ?',
            [newScheduledAt, triggerId, 'pending']
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Schedule updated' : 'Trigger not found or already sent'
        };
    } catch (error) {
        console.error('Update scheduled notification error:', error);
        throw error;
    }
}

/**
 * Cancel scheduled notification
 * @param {number} triggerId - Trigger ID
 * @returns {Promise<Object>} Result with success status
 */
async function cancelScheduledNotification(triggerId) {
    try {
        const [result] = await promisePool.execute(
            'UPDATE campaign_notification_triggers SET trigger_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trigger_status = ?',
            ['cancelled', triggerId, 'pending']
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0 ? 'Notification cancelled' : 'Trigger not found or already sent'
        };
    } catch (error) {
        console.error('Cancel scheduled notification error:', error);
        throw error;
    }
}

/**
 * Cancel multiple scheduled notifications
 * @param {Array<number>} triggerIds - Array of trigger IDs
 * @returns {Promise<Object>} Result with count of cancelled
 */
async function cancelScheduledNotifications(triggerIds) {
    try {
        if (triggerIds.length === 0) {
            return { success: true, cancelled: 0 };
        }

        const placeholders = triggerIds.map(() => '?').join(',');
        const [result] = await promisePool.execute(
            `UPDATE campaign_notification_triggers 
            SET trigger_status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
            WHERE id IN (${placeholders}) AND trigger_status = 'pending'`,
            triggerIds
        );

        return {
            success: true,
            cancelled: result.affectedRows
        };
    } catch (error) {
        console.error('Cancel scheduled notifications error:', error);
        throw error;
    }
}

/**
 * Get pending triggers ready to send
 * @returns {Promise<Array>} Array of pending triggers
 */
async function getPendingTriggers() {
    try {
        const [rows] = await promisePool.execute(
            `SELECT t.*, cn.* 
            FROM campaign_notification_triggers t
            JOIN campaign_notifications cn ON t.campaign_notification_id = cn.id
            WHERE t.trigger_status = 'pending'
            AND t.scheduled_at <= NOW()
            AND cn.is_active = TRUE
            ORDER BY t.scheduled_at ASC
            LIMIT 100`
        );

        return rows;
    } catch (error) {
        console.error('Get pending triggers error:', error);
        throw error;
    }
}

/**
 * Process pending triggers (called by cron job)
 * @returns {Promise<Object>} Result with count of processed
 */
async function processPendingTriggers() {
    try {
        const triggers = await getPendingTriggers();
        let processed = 0;
        let failed = 0;

        for (const trigger of triggers) {
            try {
                await processTrigger(trigger.id);
                processed++;
            } catch (error) {
                console.error(`Failed to process trigger ${trigger.id}:`, error);
                failed++;
            }
        }

        return { processed, failed, total: triggers.length };
    } catch (error) {
        console.error('Process pending triggers error:', error);
        throw error;
    }
}

/**
 * Process a single trigger
 * @param {number} triggerId - Trigger ID
 * @returns {Promise<void>}
 */
async function processTrigger(triggerId) {
    try {
        // Get trigger details
        const [triggers] = await promisePool.execute(
            'SELECT * FROM campaign_notification_triggers WHERE id = ?',
            [triggerId]
        );

        if (triggers.length === 0) {
            throw new Error('Trigger not found');
        }

        const trigger = triggers[0];

        // Skip if already processed
        if (trigger.trigger_status === 'sent') {
            // console.log(`⏭️  Trigger ${triggerId} already processed, skipping`);
            return;
        }

        // Check if user notification already exists (duplicate prevention)
        const [existing] = await promisePool.execute(
            `SELECT id FROM user_campaign_notifications 
             WHERE campaign_notification_id = ? AND user_id = ? AND trigger_id = ?`,
            [trigger.campaign_notification_id, trigger.user_id, triggerId]
        );

        if (existing.length > 0) {
            console.log(`⏭️  User notification already exists for trigger ${triggerId}, marking as sent`);
            await promisePool.execute(
                'UPDATE campaign_notification_triggers SET trigger_status = ?, sent_at = NOW() WHERE id = ?',
                ['sent', triggerId]
            );
            return;
        }

        // Create user notification record
        await promisePool.execute(
            `INSERT INTO user_campaign_notifications 
            (campaign_notification_id, user_id, trigger_id, delivered_at)
            VALUES (?, ?, ?, NOW())`,
            [trigger.campaign_notification_id, trigger.user_id, triggerId]
        );

        // Mark trigger as sent
        await promisePool.execute(
            'UPDATE campaign_notification_triggers SET trigger_status = ?, sent_at = NOW() WHERE id = ?',
            ['sent', triggerId]
        );

        // Handle recurring notifications
        if (trigger.is_recurring && trigger.recurrence_pattern) {
            await scheduleNextOccurrence(trigger);
        }

        console.log(`✅ Processed trigger ${triggerId} for user ${trigger.user_id}`);
    } catch (error) {
        // Mark as failed
        await promisePool.execute(
            'UPDATE campaign_notification_triggers SET trigger_status = ? WHERE id = ?',
            ['failed', triggerId]
        );
        throw error;
    }
}

/**
 * Schedule next occurrence for recurring notification
 * @param {Object} trigger - Trigger object
 * @returns {Promise<void>}
 */
async function scheduleNextOccurrence(trigger) {
    try {
        const nextDate = calculateNextOccurrence(new Date(trigger.scheduled_at), trigger.recurrence_pattern);

        await scheduleCampaignNotification(
            trigger.user_id,
            trigger.campaign_notification_id,
            nextDate,
            {
                isRecurring: true,
                recurrencePattern: trigger.recurrence_pattern,
                createdBy: trigger.created_by
            }
        );

        console.log(`📅 Scheduled next occurrence for user ${trigger.user_id} at ${nextDate}`);
    } catch (error) {
        console.error('Schedule next occurrence error:', error);
    }
}

/**
 * Calculate next occurrence date based on recurrence pattern
 * @param {Date} currentDate - Current scheduled date
 * @param {string} pattern - Recurrence pattern (daily, weekly, monthly, every_14_days, every_3_months, etc.)
 * @returns {Date} Next occurrence date
 */
function calculateNextOccurrence(currentDate, pattern) {
    const nextDate = new Date(currentDate);

    switch (pattern) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'every_14_days':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
        case 'every_3_months':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'every_4_months':
            nextDate.setMonth(nextDate.getMonth() + 4);
            break;
        default:
            // Try to parse custom pattern like "every_X_days" or "every_X_months"
            const match = pattern.match(/every_(\d+)_(days|months)/);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2];
                if (unit === 'days') {
                    nextDate.setDate(nextDate.getDate() + value);
                } else if (unit === 'months') {
                    nextDate.setMonth(nextDate.getMonth() + value);
                }
            }
    }

    return nextDate;
}

/**
 * Create recurring trigger
 * @param {number} userId - User ID
 * @param {number} campaignNotificationId - Campaign notification ID
 * @param {Object} schedule - Schedule configuration
 * @returns {Promise<number>} Trigger ID
 */
async function createRecurringTrigger(userId, campaignNotificationId, schedule) {
    const { startDate, recurrencePattern, createdBy } = schedule;

    return await scheduleCampaignNotification(
        userId,
        campaignNotificationId,
        startDate,
        {
            isRecurring: true,
            recurrencePattern,
            createdBy
        }
    );
}

module.exports = {
    scheduleCampaignNotification,
    sendCampaignNotification,
    getScheduledNotifications,
    updateScheduledNotification,
    cancelScheduledNotification,
    cancelScheduledNotifications,
    getPendingTriggers,
    processPendingTriggers,
    processTrigger, // Added for debugging
    createRecurringTrigger
};
