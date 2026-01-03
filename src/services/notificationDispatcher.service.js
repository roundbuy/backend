/**
 * Notification Dispatcher Service
 * 
 * Handles dispatching notifications to target users/guests.
 * Creates user_notification records and sends FCM push notifications.
 */

const notificationService = require('./notification.service');
const userNotificationService = require('./userNotification.service');
const deviceTokenService = require('./deviceToken.service');
const fcmService = require('./fcm.service');
const { promisePool } = require('../config/database');

/**
 * Dispatch a notification to its target audience
 * 
 * @param {number} notificationId - Notification ID to dispatch
 * @returns {Promise<Object>} Dispatch results
 */
async function dispatchNotification(notificationId) {
    try {
        console.log(`\n📤 Dispatching notification ID: ${notificationId}`);

        // Get notification details
        const notification = await notificationService.getNotificationById(notificationId);

        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.sent_at) {
            console.log('⚠️  Notification already sent');
            return {
                success: false,
                message: 'Notification already sent',
                alreadySent: true
            };
        }

        const results = {
            success: true,
            notificationId,
            targetAudience: notification.target_audience,
            userNotificationsCreated: 0,
            pushNotificationsSent: 0,
            pushNotificationsFailed: 0,
            invalidTokens: []
        };

        // Determine target users based on audience type
        let targetUserIds = [];
        let guestTokens = [];

        switch (notification.target_audience) {
            case 'all':
                // Get all active users
                const [allUsers] = await promisePool.execute(
                    'SELECT id FROM users WHERE is_active = TRUE'
                );
                targetUserIds = allUsers.map(u => u.id);

                // Also get all guest tokens
                guestTokens = await deviceTokenService.getGuestDeviceTokens();

                console.log(`   Target: All users (${targetUserIds.length} users + ${guestTokens.length} guests)`);
                break;

            case 'all_users':
                // Get all active users only
                const [users] = await promisePool.execute(
                    'SELECT id FROM users WHERE is_active = TRUE'
                );
                targetUserIds = users.map(u => u.id);

                console.log(`   Target: All users (${targetUserIds.length} users)`);
                break;

            case 'all_guests':
                // Get all guest tokens only
                guestTokens = await deviceTokenService.getGuestDeviceTokens();

                console.log(`   Target: All guests (${guestTokens.length} guests)`);
                break;

            case 'specific_users':
                // Use provided user IDs
                targetUserIds = notification.target_user_ids || [];

                console.log(`   Target: Specific users (${targetUserIds.length} users)`);
                break;

            case 'condition':
                // Get users matching conditions
                targetUserIds = await notificationService.getUserIdsByConditions(
                    notification.target_conditions
                );

                console.log(`   Target: Condition-based (${targetUserIds.length} users)`);
                break;

            default:
                throw new Error(`Unknown target audience: ${notification.target_audience}`);
        }

        // Create user_notification records for logged-in users
        if (targetUserIds.length > 0) {
            const createResult = await userNotificationService.createUserNotifications(
                notificationId,
                targetUserIds
            );
            results.userNotificationsCreated = createResult.count;
            console.log(`   ✅ Created ${createResult.count} user notification records`);
        }

        // Get device tokens for push notifications
        let deviceTokens = [];

        // Get tokens for logged-in users
        if (targetUserIds.length > 0) {
            const userTokens = await deviceTokenService.getDeviceTokensByUserIds(targetUserIds);
            deviceTokens = [...deviceTokens, ...userTokens];
        }

        // Add guest tokens
        if (guestTokens.length > 0) {
            deviceTokens = [...deviceTokens, ...guestTokens];
        }

        console.log(`   📱 Found ${deviceTokens.length} device tokens`);

        // Send FCM push notifications
        if (deviceTokens.length > 0) {
            const fcmResult = await fcmService.sendToMultipleDevices(
                deviceTokens,
                notification
            );

            results.pushNotificationsSent = fcmResult.sentCount;
            results.pushNotificationsFailed = fcmResult.failedCount;
            results.invalidTokens = fcmResult.invalidTokens || [];

            console.log(`   ✅ Push notifications: ${fcmResult.sentCount} sent, ${fcmResult.failedCount} failed`);

            // Deactivate invalid tokens
            if (results.invalidTokens.length > 0) {
                console.log(`   🗑️  Deactivating ${results.invalidTokens.length} invalid tokens`);
                for (const token of results.invalidTokens) {
                    await deviceTokenService.deactivateDeviceToken(token);
                }
            }
        } else {
            console.log('   ⚠️  No device tokens found - no push notifications sent');
        }

        // Update notification sent_at timestamp
        await notificationService.updateNotification(notificationId, {
            sentAt: new Date()
        });

        console.log(`✅ Notification dispatched successfully!\n`);

        return results;
    } catch (error) {
        console.error('Dispatch notification error:', error);
        throw error;
    }
}

/**
 * Dispatch multiple notifications (batch)
 * 
 * @param {Array<number>} notificationIds - Array of notification IDs
 * @returns {Promise<Array>} Array of dispatch results
 */
async function dispatchMultipleNotifications(notificationIds) {
    const results = [];

    for (const id of notificationIds) {
        try {
            const result = await dispatchNotification(id);
            results.push({ notificationId: id, ...result });
        } catch (error) {
            results.push({
                notificationId: id,
                success: false,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Re-send a notification to users who didn't receive it
 * 
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Dispatch results
 */
async function resendNotification(notificationId) {
    try {
        console.log(`\n🔄 Re-sending notification ID: ${notificationId}`);

        // Get notification
        const notification = await notificationService.getNotificationById(notificationId);

        if (!notification) {
            throw new Error('Notification not found');
        }

        // Get users who have the notification but it wasn't delivered
        const [undeliveredUsers] = await promisePool.execute(
            `SELECT DISTINCT user_id 
       FROM user_notifications 
       WHERE notification_id = ? AND delivered_at IS NULL`,
            [notificationId]
        );

        if (undeliveredUsers.length === 0) {
            return {
                success: true,
                message: 'No undelivered notifications found',
                sentCount: 0
            };
        }

        const userIds = undeliveredUsers.map(u => u.user_id);

        // Get device tokens
        const deviceTokens = await deviceTokenService.getDeviceTokensByUserIds(userIds);

        // Send push notifications
        const fcmResult = await fcmService.sendToMultipleDevices(
            deviceTokens,
            notification
        );

        console.log(`✅ Re-sent to ${fcmResult.sentCount} devices\n`);

        return {
            success: true,
            sentCount: fcmResult.sentCount,
            failedCount: fcmResult.failedCount,
            invalidTokens: fcmResult.invalidTokens
        };
    } catch (error) {
        console.error('Resend notification error:', error);
        throw error;
    }
}

module.exports = {
    dispatchNotification,
    dispatchMultipleNotifications,
    resendNotification
};
