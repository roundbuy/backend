const { promisePool } = require('../config/database');

/**
 * Create a notification for a user
 * @param {Object} params - Notification parameters
 * @param {number} params.user_id - User ID to send notification to
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} params.data - Additional data (will be JSON stringified)
 * @param {string} params.image_url - Optional image URL
 * @param {string} params.action_type - Optional action type (e.g., 'open_screen')
 * @param {Object} params.action_data - Optional action data
 * @returns {Promise<number>} Notification ID
 */
async function createNotificationForUser({
  user_id,
  type,
  title,
  message,
  data = null,
  image_url = null,
  action_type = null,
  action_data = null
}) {
  try {
    // First, create the notification
    const [notificationResult] = await promisePool.execute(`
      INSERT INTO notifications (
        type,
        title,
        message,
        image_url,
        action_type,
        action_data,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      type,
      title,
      message,
      image_url,
      action_type,
      action_data ? JSON.stringify(action_data) : null,
      user_id // System notifications are created by the user for themselves
    ]);

    const notificationId = notificationResult.insertId;

    // Then, create the user_notification entry
    await promisePool.execute(`
      INSERT INTO user_notifications (
        user_id,
        notification_id,
        delivered_at
      ) VALUES (?, ?, NOW())
    `, [
      user_id,
      notificationId
    ]);

    console.log(`✓ Notification created for user ${user_id}: ${type} - ${title}`);
    return notificationId;

  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param {Array<number>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (same as createNotificationForUser)
 * @returns {Promise<number>} Notification ID
 */
async function createNotificationForUsers(userIds, notificationData) {
  try {
    // Create the notification once
    const [notificationResult] = await promisePool.execute(`
      INSERT INTO notifications (
        type,
        title,
        message,
        image_url,
        action_type,
        action_data,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.image_url || null,
      notificationData.action_type || null,
      notificationData.action_data ? JSON.stringify(notificationData.action_data) : null,
      userIds[0] || 1 // Use first user ID or default to admin (1) for system notifications
    ]);

    const notificationId = notificationResult.insertId;

    // Create user_notification entries for all users
    const values = userIds.map(userId => [
      userId,
      notificationId,
      notificationData.data ? JSON.stringify(notificationData.data) : null,
      new Date()
    ]);

    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await promisePool.execute(`
        INSERT INTO user_notifications (user_id, notification_id, data, delivered_at)
        VALUES ${placeholders}
      `, flatValues);
    }

    console.log(`✓ Notification created for ${userIds.length} users: ${notificationData.type} - ${notificationData.title}`);
    return notificationId;

  } catch (error) {
    console.error('Error creating notifications for multiple users:', error);
    throw error;
  }
}

module.exports = {
  createNotificationForUser,
  createNotificationForUsers
};
