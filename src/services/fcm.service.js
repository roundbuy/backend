/**
 * FCM (Firebase Cloud Messaging) Service
 * 
 * Handles sending push notifications via Firebase Cloud Messaging.
 * Supports single device, multiple devices, and topic-based messaging.
 */

const { getFirebaseAdmin, isFirebaseReady } = require('../config/firebase.config');

/**
 * Send notification to a single device
 * 
 * @param {string} deviceToken - FCM device token
 * @param {Object} notification - Notification object
 * @param {Object} [data] - Additional data payload
 * @returns {Promise<Object>} Result with success status and message ID
 */
async function sendToDevice(deviceToken, notification, data = {}) {
    try {
        if (!isFirebaseReady()) {
            console.warn('Firebase not initialized - skipping push notification');
            return { success: false, error: 'Firebase not initialized' };
        }

        const admin = getFirebaseAdmin();

        // Build FCM message
        const message = {
            notification: {
                title: notification.title,
                body: notification.message
            },
            data: {
                notificationId: String(notification.id),
                type: notification.type || 'push',
                priority: notification.priority || 'medium',
                actionType: notification.action_type || 'none',
                actionData: JSON.stringify(notification.action_data || {}),
                ...data
            },
            token: deviceToken
        };

        // Add image if available
        if (notification.image_url) {
            message.notification.imageUrl = notification.image_url;
        }

        // Set Android-specific options
        message.android = {
            priority: notification.priority === 'high' ? 'high' : 'normal',
            notification: {
                sound: 'default',
                channelId: 'default'
            }
        };

        // Set iOS-specific options
        message.apns = {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                    contentAvailable: true
                }
            }
        };

        // Send message
        const response = await admin.messaging().send(message);

        console.log(`✅ Push notification sent to device: ${deviceToken.substring(0, 20)}...`);

        return {
            success: true,
            messageId: response,
            deviceToken: deviceToken
        };
    } catch (error) {
        console.error('FCM send error:', error.message);

        // Check for invalid token errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return {
                success: false,
                error: 'Invalid or expired token',
                invalidToken: true,
                deviceToken: deviceToken
            };
        }

        return {
            success: false,
            error: error.message,
            deviceToken: deviceToken
        };
    }
}

/**
 * Send notification to multiple devices (batch)
 * Maximum 500 tokens per batch
 * 
 * @param {Array<Object>} deviceTokens - Array of device token objects with token and user_id
 * @param {Object} notification - Notification object
 * @param {Object} [data] - Additional data payload
 * @returns {Promise<Object>} Results with success/failure counts
 */
async function sendToMultipleDevices(deviceTokens, notification, data = {}) {
    try {
        if (!isFirebaseReady()) {
            console.warn('Firebase not initialized - skipping push notifications');
            return {
                success: false,
                error: 'Firebase not initialized',
                sentCount: 0,
                failedCount: deviceTokens.length
            };
        }

        if (!deviceTokens || deviceTokens.length === 0) {
            return {
                success: true,
                sentCount: 0,
                failedCount: 0,
                invalidTokens: []
            };
        }

        const admin = getFirebaseAdmin();
        const results = {
            success: true,
            sentCount: 0,
            failedCount: 0,
            invalidTokens: []
        };

        // Process in batches of 500 (FCM limit)
        const batchSize = 500;
        const batches = [];

        for (let i = 0; i < deviceTokens.length; i += batchSize) {
            batches.push(deviceTokens.slice(i, i + batchSize));
        }

        console.log(`📤 Sending to ${deviceTokens.length} devices in ${batches.length} batch(es)`);

        for (const batch of batches) {
            // Build messages for this batch
            const messages = batch.map(tokenObj => ({
                notification: {
                    title: notification.title,
                    body: notification.message,
                    ...(notification.image_url && { imageUrl: notification.image_url })
                },
                data: {
                    notificationId: String(notification.id),
                    type: notification.type || 'push',
                    priority: notification.priority || 'medium',
                    actionType: notification.action_type || 'none',
                    actionData: JSON.stringify(notification.action_data || {}),
                    ...data
                },
                token: tokenObj.device_token,
                android: {
                    priority: notification.priority === 'high' ? 'high' : 'normal',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            contentAvailable: true
                        }
                    }
                }
            }));

            try {
                // Send batch
                const response = await admin.messaging().sendEach(messages);

                // Process results
                response.responses.forEach((resp, idx) => {
                    if (resp.success) {
                        results.sentCount++;
                    } else {
                        results.failedCount++;

                        // Check if token is invalid
                        if (resp.error &&
                            (resp.error.code === 'messaging/invalid-registration-token' ||
                                resp.error.code === 'messaging/registration-token-not-registered')) {
                            results.invalidTokens.push(batch[idx].device_token);
                        }
                    }
                });
            } catch (error) {
                console.error('Batch send error:', error.message);
                results.failedCount += batch.length;
            }
        }

        console.log(`✅ Batch send complete: ${results.sentCount} sent, ${results.failedCount} failed, ${results.invalidTokens.length} invalid tokens`);

        return results;
    } catch (error) {
        console.error('Send to multiple devices error:', error);
        return {
            success: false,
            error: error.message,
            sentCount: 0,
            failedCount: deviceTokens.length,
            invalidTokens: []
        };
    }
}

/**
 * Send notification to a topic
 * 
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification object
 * @param {Object} [data] - Additional data payload
 * @returns {Promise<Object>} Result with success status
 */
async function sendToTopic(topic, notification, data = {}) {
    try {
        if (!isFirebaseReady()) {
            console.warn('Firebase not initialized - skipping push notification');
            return { success: false, error: 'Firebase not initialized' };
        }

        const admin = getFirebaseAdmin();

        const message = {
            notification: {
                title: notification.title,
                body: notification.message,
                ...(notification.image_url && { imageUrl: notification.image_url })
            },
            data: {
                notificationId: String(notification.id),
                type: notification.type || 'push',
                priority: notification.priority || 'medium',
                actionType: notification.action_type || 'none',
                actionData: JSON.stringify(notification.action_data || {}),
                ...data
            },
            topic: topic,
            android: {
                priority: notification.priority === 'high' ? 'high' : 'normal'
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        const response = await admin.messaging().send(message);

        console.log(`✅ Push notification sent to topic: ${topic}`);

        return {
            success: true,
            messageId: response
        };
    } catch (error) {
        console.error('FCM topic send error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendToDevice,
    sendToMultipleDevices,
    sendToTopic
};
