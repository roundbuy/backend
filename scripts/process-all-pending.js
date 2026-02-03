/**
 * Find and Process All Pending Triggers
 * Finds your user and processes all pending triggers
 */

const { promisePool } = require('../src/config/database');
const campaignTriggerService = require('../src/services/campaignTrigger.service');

async function findAndProcessAllPending() {
    try {
        console.log(`\n🔍 Finding all users with pending triggers...\n`);

        // Get all users with pending triggers
        const [usersWithPending] = await promisePool.execute(
            `SELECT user_id, COUNT(*) as pending_count
             FROM campaign_notification_triggers
             WHERE trigger_status = 'pending'
             GROUP BY user_id
             ORDER BY pending_count DESC`
        );

        if (usersWithPending.length === 0) {
            console.log('✅ No pending triggers found for any user.');
            return;
        }

        console.log(`📊 Users with pending triggers:\n`);
        console.table(usersWithPending);

        // Process all pending triggers for each user
        for (const userRow of usersWithPending) {
            const userId = userRow.user_id;
            console.log(`\n🔄 Processing pending triggers for user ${userId}...\n`);

            const [triggers] = await promisePool.execute(
                `SELECT t.*, cn.type_key
                 FROM campaign_notification_triggers t
                 JOIN campaign_notifications cn ON t.campaign_notification_id = cn.id
                 WHERE t.user_id = ? AND t.trigger_status = 'pending'`,
                [userId]
            );

            console.log(`Found ${triggers.length} pending triggers for user ${userId}`);

            for (const trigger of triggers) {
                try {
                    console.log(`  Processing trigger ${trigger.id} (${trigger.type_key})...`);
                    await campaignTriggerService.processTrigger(trigger.id);
                    console.log(`  ✅ Processed trigger ${trigger.id}`);
                } catch (error) {
                    console.error(`  ❌ Failed to process trigger ${trigger.id}:`, error.message);
                }
            }
        }

        // Show final results
        console.log(`\n📊 Final Results:\n`);

        for (const userRow of usersWithPending) {
            const userId = userRow.user_id;

            const [userNotifications] = await promisePool.execute(
                `SELECT COUNT(*) as count FROM user_campaign_notifications WHERE user_id = ?`,
                [userId]
            );

            const [remainingPending] = await promisePool.execute(
                `SELECT COUNT(*) as count FROM campaign_notification_triggers 
                 WHERE user_id = ? AND trigger_status = 'pending'`,
                [userId]
            );

            console.log(`User ${userId}:`);
            console.log(`  ✅ Campaign notifications: ${userNotifications[0].count}`);
            console.log(`  ⏳ Remaining pending: ${remainingPending[0].count}`);
        }

        console.log(`\n✅ All done!`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

findAndProcessAllPending();
