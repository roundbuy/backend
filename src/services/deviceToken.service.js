/**
 * Device Token Service
 * 
 * Manages FCM/Expo push tokens for both logged-in users and guest users.
 * Supports registering, updating, and retrieving device tokens.
 */

const { promisePool } = require('../config/database');

/**
 * Register or update a device token
 * Works for both authenticated users and guests
 * 
 * @param {Object} data - Token data
 * @param {number|null} data.userId - User ID (null for guests)
 * @param {string} data.deviceToken - FCM/Expo push token
 * @param {string} data.platform - 'ios', 'android', or 'web'
 * @param {string} data.deviceId - Unique device identifier (required for guests)
 * @param {string} [data.deviceName] - Optional device name
 * @returns {Promise<Object>} Result with success status
 */
async function registerDeviceToken(data) {
    const { userId = null, deviceToken, platform, deviceId, deviceName = null } = data;

    try {
        // Validate required fields
        if (!deviceToken || !platform) {
            throw new Error('Device token and platform are required');
        }

        if (!userId && !deviceId) {
            throw new Error('Either userId or deviceId is required');
        }

        // Insert or update on duplicate key
        const [result] = await promisePool.execute(
            `INSERT INTO user_device_tokens 
        (user_id, device_token, platform, device_name, device_id, is_active, last_used_at)
      VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE 
        user_id = VALUES(user_id),
        platform = VALUES(platform),
        device_name = VALUES(device_name),
        device_id = VALUES(device_id),
        is_active = TRUE,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP`,
            [userId, deviceToken, platform, deviceName, deviceId]
        );

        return {
            success: true,
            message: 'Device token registered successfully',
            tokenId: result.insertId || null
        };
    } catch (error) {
        console.error('Register device token error:', error);
        throw error;
    }
}

/**
 * Get all active device tokens for a user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of device tokens
 */
async function getDeviceTokens(userId) {
    try {
        const [rows] = await promisePool.execute(
            `SELECT id, device_token, platform, device_name, device_id, last_used_at, created_at
       FROM user_device_tokens
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY last_used_at DESC`,
            [userId]
        );

        return rows;
    } catch (error) {
        console.error('Get device tokens error:', error);
        throw error;
    }
}

/**
 * Get device tokens for multiple users (for batch notifications)
 * 
 * @param {Array<number>} userIds - Array of user IDs
 * @returns {Promise<Array>} Array of device tokens with user info
 */
async function getDeviceTokensByUserIds(userIds) {
    try {
        if (!userIds || userIds.length === 0) {
            return [];
        }

        const placeholders = userIds.map(() => '?').join(',');

        const [rows] = await promisePool.execute(
            `SELECT id, user_id, device_token, platform, device_id
       FROM user_device_tokens
       WHERE user_id IN (${placeholders}) AND is_active = TRUE`,
            userIds
        );

        return rows;
    } catch (error) {
        console.error('Get device tokens by user IDs error:', error);
        throw error;
    }
}

/**
 * Get all guest device tokens
 * 
 * @returns {Promise<Array>} Array of guest device tokens
 */
async function getGuestDeviceTokens() {
    try {
        const [rows] = await promisePool.execute(
            `SELECT id, device_token, platform, device_id
       FROM user_device_tokens
       WHERE user_id IS NULL AND is_active = TRUE
       ORDER BY last_used_at DESC`
        );

        return rows;
    } catch (error) {
        console.error('Get guest device tokens error:', error);
        throw error;
    }
}

/**
 * Get all active device tokens (users + guests)
 * 
 * @returns {Promise<Array>} Array of all device tokens
 */
async function getAllDeviceTokens() {
    try {
        const [rows] = await promisePool.execute(
            `SELECT id, user_id, device_token, platform, device_id
       FROM user_device_tokens
       WHERE is_active = TRUE
       ORDER BY last_used_at DESC`
        );

        return rows;
    } catch (error) {
        console.error('Get all device tokens error:', error);
        throw error;
    }
}

/**
 * Deactivate a device token (soft delete)
 * 
 * @param {string} deviceToken - Device token to deactivate
 * @returns {Promise<Object>} Result with success status
 */
async function deactivateDeviceToken(deviceToken) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE user_device_tokens
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE device_token = ?`,
            [deviceToken]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Device token deactivated'
                : 'Device token not found'
        };
    } catch (error) {
        console.error('Deactivate device token error:', error);
        throw error;
    }
}

/**
 * Delete a device token permanently
 * 
 * @param {string} deviceToken - Device token to delete
 * @returns {Promise<Object>} Result with success status
 */
async function deleteDeviceToken(deviceToken) {
    try {
        const [result] = await promisePool.execute(
            `DELETE FROM user_device_tokens WHERE device_token = ?`,
            [deviceToken]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Device token deleted'
                : 'Device token not found'
        };
    } catch (error) {
        console.error('Delete device token error:', error);
        throw error;
    }
}

/**
 * Clean up inactive tokens (not used in 90 days)
 * 
 * @returns {Promise<Object>} Result with count of deleted tokens
 */
async function cleanupInactiveTokens() {
    try {
        const [result] = await promisePool.execute(
            `DELETE FROM user_device_tokens
       WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
       OR (is_active = FALSE AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
        );

        return {
            success: true,
            deletedCount: result.affectedRows,
            message: `Cleaned up ${result.affectedRows} inactive tokens`
        };
    } catch (error) {
        console.error('Cleanup inactive tokens error:', error);
        throw error;
    }
}

/**
 * Update user_id when guest logs in
 * 
 * @param {string} deviceId - Device ID
 * @param {number} userId - User ID to associate
 * @returns {Promise<Object>} Result with success status
 */
async function associateDeviceWithUser(deviceId, userId) {
    try {
        const [result] = await promisePool.execute(
            `UPDATE user_device_tokens
       SET user_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE device_id = ? AND user_id IS NULL`,
            [userId, deviceId]
        );

        return {
            success: result.affectedRows > 0,
            message: result.affectedRows > 0
                ? 'Device associated with user'
                : 'Device not found or already associated'
        };
    } catch (error) {
        console.error('Associate device with user error:', error);
        throw error;
    }
}

module.exports = {
    registerDeviceToken,
    getDeviceTokens,
    getDeviceTokensByUserIds,
    getGuestDeviceTokens,
    getAllDeviceTokens,
    deactivateDeviceToken,
    deleteDeviceToken,
    cleanupInactiveTokens,
    associateDeviceWithUser
};
