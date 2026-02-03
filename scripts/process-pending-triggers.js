/**
 * Process Pending Campaign Notification Triggers
 * This script checks for pending triggers and processes them
 */

const { promisePool } = require('../src/config/database');
const campaignTriggerService = require('../src/services/campaignTrigger.service');

async function processPendingTriggersForUser(userId) {
    try {
        console.log(`\n🔍 Checking pending triggers for user ${userId}...\n`);

        // Get all pending triggers for this user
        const [triggers] = await promisePool.execute(
            `SELECT t.*, cn.type_key, cn.collapsed_title
             FROM campaign_notification_triggers t
             JOIN campaign_notifications cn ON t.campaign_notification_id = cn.id
             WHERE t.user_id = ? AND t.trigger_status = 'pending'
             ORDER BY t.created_at DESC`,
            [userId]
        );

        if (triggers.length === 0) {
            console.log('✅ No pending triggers found for this user.');

            // Check if there are any triggers at all
            const [allTriggers] = await promisePool.execute(
                `SELECT id, trigger_status, sent_at, created_at
                 FROM campaign_notification_triggers
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT 5`,
                [userId]
            );

            console.log(`\n📊 Recent triggers for user ${userId}:`);
            console.table(allTriggers);
            return;
        }

        console.log(`📋 Found ${triggers.length} pending trigger(s):\n`);
        console.table(triggers.map(t => ({
            id: t.id,
            campaign: t.type_key,
            title: t.collapsed_title,
            scheduled_at: t.scheduled_at,
            created_at: t.created_at
        })));

        // Process each trigger
        console.log(`\n🔄 Processing triggers...\n`);

        for (const trigger of triggers) {
            try {
                console.log(`Processing trigger ${trigger.id} (${trigger.type_key})...`);
                await campaignTriggerService.processTrigger(trigger.id);
                console.log(`✅ Successfully processed trigger ${trigger.id}`);
            } catch (error) {
                console.error(`❌ Failed to process trigger ${trigger.id}:`, error.message);
            }
        }

        // Check results
        console.log(`\n📊 Checking results...\n`);

        const [userNotifications] = await promisePool.execute(
            `SELECT ucn.*, cn.type_key, cn.collapsed_title
             FROM user_campaign_notifications ucn
             JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
             WHERE ucn.user_id = ?
             ORDER BY ucn.delivered_at DESC
             LIMIT 5`,
            [userId]
        );

        console.log(`✅ User now has ${userNotifications.length} campaign notification(s):\n`);
        console.table(userNotifications.map(n => ({
            id: n.id,
            campaign: n.type_key,
            title: n.collapsed_title,
            delivered_at: n.delivered_at,
            is_read: n.is_read
        })));

        console.log(`\n✅ Done! User ${userId} should now see notifications in the mobile app.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
    console.error('❌ Please provide a user ID');
    console.log('Usage: node process-pending-triggers.js <USER_ID>');
    process.exit(1);
}

processPendingTriggersForUser(userId);
