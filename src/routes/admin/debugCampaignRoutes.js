/**
 * Debug Test Endpoint for Campaign Notifications
 * Add this to your admin routes temporarily for debugging
 */

const express = require('express');
const router = express.Router();
const { promisePool } = require('../../config/database');
const campaignTriggerService = require('../../services/campaignTrigger.service');

/**
 * Debug endpoint - Check campaign notification flow
 * GET /api/v1/admin/campaign-notifications/debug/:userId
 */
router.get('/debug/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Check triggers for this user
        const [triggers] = await promisePool.execute(
            `SELECT * FROM campaign_notification_triggers 
             WHERE user_id = ? 
             ORDER BY created_at DESC LIMIT 5`,
            [userId]
        );

        // 2. Check user notifications
        const [userNotifications] = await promisePool.execute(
            `SELECT * FROM user_campaign_notifications 
             WHERE user_id = ? 
             ORDER BY delivered_at DESC LIMIT 5`,
            [userId]
        );

        // 3. Check pending triggers
        const [pendingTriggers] = await promisePool.execute(
            `SELECT * FROM campaign_notification_triggers 
             WHERE user_id = ? AND trigger_status = 'pending'`,
            [userId]
        );

        // 4. Manually process pending triggers
        let processed = 0;
        for (const trigger of pendingTriggers) {
            try {
                await campaignTriggerService.processTrigger(trigger.id);
                processed++;
            } catch (error) {
                console.error(`Failed to process trigger ${trigger.id}:`, error);
            }
        }

        res.json({
            success: true,
            userId,
            triggers: triggers.length,
            userNotifications: userNotifications.length,
            pendingTriggers: pendingTriggers.length,
            processedNow: processed,
            data: {
                triggers,
                userNotifications,
                pendingTriggers
            }
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Force process all pending triggers
 * POST /api/v1/admin/campaign-notifications/debug/process-pending
 */
router.post('/debug/process-pending', async (req, res) => {
    try {
        const result = await campaignTriggerService.processPendingTriggers();

        res.json({
            success: true,
            message: 'Processed pending triggers',
            ...result
        });
    } catch (error) {
        console.error('Process pending error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
