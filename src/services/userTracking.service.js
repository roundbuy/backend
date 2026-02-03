/**
 * User Tracking Service
 * Tracks user behavior for campaign notification triggers
 */

const { promisePool } = require('../config/database');
const campaignTriggerService = require('./campaignTrigger.service');
const campaignNotificationService = require('./campaignNotification.service');

/**
 * Track user login
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function trackLogin(userId) {
    try {
        // Update login count and set first_login_at if null
        await promisePool.execute(
            `UPDATE users 
            SET login_count = login_count + 1,
                first_login_at = COALESCE(first_login_at, NOW()),
                last_login = NOW()
            WHERE id = ?`,
            [userId]
        );

        // Get updated user data
        const [users] = await promisePool.execute(
            'SELECT login_count, first_login_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length > 0) {
            const user = users[0];

            // Trigger notifications based on login count
            await checkLoginBasedTriggers(userId, user.login_count);
        }
    } catch (error) {
        console.error('Track login error:', error);
        // Don't throw - tracking should not break login flow
    }
}

/**
 * Track email verification
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function trackEmailVerification(userId) {
    try {
        // Set email_verified_at
        await promisePool.execute(
            'UPDATE users SET email_verified_at = NOW(), is_verified = TRUE WHERE id = ?',
            [userId]
        );

        // Trigger account verified notification
        const notification = await campaignNotificationService.getCampaignNotificationByTypeKey('account_verified');
        if (notification && notification.is_active) {
            await campaignTriggerService.sendCampaignNotification(userId, notification.id);
        }
    } catch (error) {
        console.error('Track email verification error:', error);
    }
}

/**
 * Track password reset request
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function trackPasswordReset(userId) {
    try {
        // Trigger reset password notification
        const notification = await campaignNotificationService.getCampaignNotificationByTypeKey('reset_password');
        if (notification && notification.is_active) {
            await campaignTriggerService.sendCampaignNotification(userId, notification.id);
        }
    } catch (error) {
        console.error('Track password reset error:', error);
    }
}

/**
 * Track subscription change
 * @param {number} userId - User ID
 * @param {number} planId - New plan ID
 * @param {string} planName - Plan name (green, gold, violet)
 * @returns {Promise<void>}
 */
async function trackSubscriptionChange(userId, planId, planName) {
    try {
        // Schedule plan feature notifications (1 month after subscription, then every 3 months)
        const featureNotificationKey = `${planName.toLowerCase()}_plan_feature`;
        const notification = await campaignNotificationService.getCampaignNotificationByTypeKey(featureNotificationKey);

        if (notification && notification.is_active) {
            // Schedule first notification for 1 month later
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            await campaignTriggerService.scheduleCampaignNotification(
                userId,
                notification.id,
                oneMonthLater,
                {
                    isRecurring: true,
                    recurrencePattern: 'every_3_months'
                }
            );
        }

        // Schedule upgrade notifications based on current plan
        if (planName.toLowerCase() === 'green') {
            // Schedule upgrade to gold notification
            const upgradeNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('upgrade_to_gold');
            if (upgradeNotification && upgradeNotification.is_active) {
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                await campaignTriggerService.scheduleCampaignNotification(
                    userId,
                    upgradeNotification.id,
                    oneMonthLater
                );
            }
        } else if (planName.toLowerCase() === 'gold') {
            // Schedule upgrade to violet notification
            const upgradeNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('upgrade_to_violet');
            if (upgradeNotification && upgradeNotification.is_active) {
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                await campaignTriggerService.scheduleCampaignNotification(
                    userId,
                    upgradeNotification.id,
                    oneMonthLater
                );
            }
        }
    } catch (error) {
        console.error('Track subscription change error:', error);
    }
}

/**
 * Check and trigger login-based notifications
 * @param {number} userId - User ID
 * @param {number} loginCount - Current login count
 * @returns {Promise<void>}
 */
async function checkLoginBasedTriggers(userId, loginCount) {
    try {
        // After first login: schedule search page instructions
        if (loginCount === 1) {
            const notification = await campaignNotificationService.getCampaignNotificationByTypeKey('search_page_instructions');
            if (notification && notification.is_active) {
                // Send immediately after first login
                await campaignTriggerService.sendCampaignNotification(userId, notification.id);

                // Schedule again for 1 month later
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                await campaignTriggerService.scheduleCampaignNotification(userId, notification.id, oneMonthLater);
            }
        }

        // After second login: trigger ATT and Cookies preferences
        if (loginCount === 2) {
            // ATT Preferences
            const attNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('att_preferences');
            if (attNotification && attNotification.is_active) {
                await campaignTriggerService.sendCampaignNotification(userId, attNotification.id);

                // Schedule again for 2 months later
                const twoMonthsLater = new Date();
                twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
                await campaignTriggerService.scheduleCampaignNotification(userId, attNotification.id, twoMonthsLater);
            }

            // Cookies Preferences
            const cookiesNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('cookies_preferences');
            if (cookiesNotification && cookiesNotification.is_active) {
                await campaignTriggerService.sendCampaignNotification(userId, cookiesNotification.id);

                // Schedule again for 2 months later
                const twoMonthsLater = new Date();
                twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
                await campaignTriggerService.scheduleCampaignNotification(userId, cookiesNotification.id, twoMonthsLater);
            }
        }
    } catch (error) {
        console.error('Check login-based triggers error:', error);
    }
}

/**
 * Schedule time-based notifications for new user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function scheduleTimeBasedNotifications(userId) {
    try {
        // Privacy & Security - 1 week after signup
        const privacyNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('privacy_security');
        if (privacyNotification && privacyNotification.is_active) {
            const oneWeekLater = new Date();
            oneWeekLater.setDate(oneWeekLater.getDate() + 7);
            await campaignTriggerService.scheduleCampaignNotification(userId, privacyNotification.id, oneWeekLater);
        }

        // Privacy Policy Update - 1 week after signup
        const policyNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('privacy_policy_update');
        if (policyNotification && policyNotification.is_active) {
            const oneWeekLater = new Date();
            oneWeekLater.setDate(oneWeekLater.getDate() + 7);
            await campaignTriggerService.scheduleCampaignNotification(userId, policyNotification.id, oneWeekLater);
        }

        // Privacy & sec +PDF - recurring every 4 months
        const pdfNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('privacy_sec_pdf');
        if (pdfNotification && pdfNotification.is_active) {
            const fourMonthsLater = new Date();
            fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);
            await campaignTriggerService.scheduleCampaignNotification(
                userId,
                pdfNotification.id,
                fourMonthsLater,
                {
                    isRecurring: true,
                    recurrencePattern: 'every_4_months'
                }
            );
        }

        // Legal Doc - recurring every 4 months
        const legalNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('legal_doc');
        if (legalNotification && legalNotification.is_active) {
            const fourMonthsLater = new Date();
            fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);
            await campaignTriggerService.scheduleCampaignNotification(
                userId,
                legalNotification.id,
                fourMonthsLater,
                {
                    isRecurring: true,
                    recurrencePattern: 'every_4_months'
                }
            );
        }

        // Discount Offer - recurring every 14 days
        const discountNotification = await campaignNotificationService.getCampaignNotificationByTypeKey('discount_offer');
        if (discountNotification && discountNotification.is_active) {
            const fourteenDaysLater = new Date();
            fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
            await campaignTriggerService.scheduleCampaignNotification(
                userId,
                discountNotification.id,
                fourteenDaysLater,
                {
                    isRecurring: true,
                    recurrencePattern: 'every_14_days'
                }
            );
        }
    } catch (error) {
        console.error('Schedule time-based notifications error:', error);
    }
}

/**
 * Get user behavior metrics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User metrics
 */
async function getUserBehaviorMetrics(userId) {
    try {
        const [users] = await promisePool.execute(
            `SELECT 
                login_count,
                first_login_at,
                last_login,
                email_verified_at,
                created_at,
                subscription_plan_id
            FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return null;
        }

        const user = users[0];

        // Calculate days since signup
        const daysSinceSignup = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));

        return {
            login_count: user.login_count || 0,
            first_login_at: user.first_login_at,
            last_login: user.last_login,
            email_verified_at: user.email_verified_at,
            days_since_signup: daysSinceSignup,
            subscription_plan_id: user.subscription_plan_id
        };
    } catch (error) {
        console.error('Get user behavior metrics error:', error);
        throw error;
    }
}

module.exports = {
    trackLogin,
    trackEmailVerification,
    trackPasswordReset,
    trackSubscriptionChange,
    scheduleTimeBasedNotifications,
    getUserBehaviorMetrics
};
