/**
 * Complete Campaign Notification System Test
 * Tests the entire flow from admin panel send to mobile app display
 */

const { promisePool } = require('../src/config/database');
const campaignTriggerService = require('../src/services/campaignTrigger.service');

async function testCompleteCampaignFlow(userId, campaignNotificationId) {
    console.log('\n🧪 COMPLETE CAMPAIGN NOTIFICATION SYSTEM TEST\n');
    console.log('='.repeat(60));

    try {
        // STEP 1: Check campaign notification exists
        console.log('\n📋 STEP 1: Checking campaign notification...');
        const [campaigns] = await promisePool.execute(
            'SELECT * FROM campaign_notifications WHERE id = ?',
            [campaignNotificationId]
        );

        if (campaigns.length === 0) {
            console.error('❌ Campaign notification not found!');
            return;
        }

        console.log('✅ Campaign found:', campaigns[0].type_key);
        console.log('   Title:', campaigns[0].collapsed_title);
        console.log('   Active:', campaigns[0].is_active ? 'Yes' : 'No');

        // STEP 2: Check for pending triggers
        console.log('\n📋 STEP 2: Checking for pending triggers...');
        const [pendingTriggers] = await promisePool.execute(
            `SELECT * FROM campaign_notification_triggers 
             WHERE user_id = ? AND campaign_notification_id = ? AND trigger_status = 'pending'`,
            [userId, campaignNotificationId]
        );

        console.log(`   Found ${pendingTriggers.length} pending trigger(s)`);

        if (pendingTriggers.length > 0) {
            console.log('\n🔄 STEP 3: Processing pending triggers...');
            for (const trigger of pendingTriggers) {
                console.log(`   Processing trigger ${trigger.id}...`);
                try {
                    await campaignTriggerService.processTrigger(trigger.id);
                    console.log(`   ✅ Trigger ${trigger.id} processed successfully`);
                } catch (error) {
                    console.error(`   ❌ Failed to process trigger ${trigger.id}:`, error.message);
                }
            }
        }

        // STEP 4: Check user_campaign_notifications
        console.log('\n📋 STEP 4: Checking user campaign notifications...');
        const [userNotifications] = await promisePool.execute(
            `SELECT ucn.*, cn.type_key, cn.collapsed_title
             FROM user_campaign_notifications ucn
             JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
             WHERE ucn.user_id = ? AND ucn.campaign_notification_id = ?
             ORDER BY ucn.delivered_at DESC`,
            [userId, campaignNotificationId]
        );

        console.log(`   Found ${userNotifications.length} user notification(s)`);
        if (userNotifications.length > 0) {
            console.log('   Latest notification:');
            console.log('     ID:', userNotifications[0].id);
            console.log('     Type:', userNotifications[0].type_key);
            console.log('     Delivered:', userNotifications[0].delivered_at);
            console.log('     Read:', userNotifications[0].is_read ? 'Yes' : 'No');
        }

        // STEP 5: Test API endpoint
        console.log('\n📋 STEP 5: Testing API endpoint...');
        const [apiResult] = await promisePool.execute(
            `SELECT 
                ucn.*,
                cn.*,
                ucn.id as user_notification_id
            FROM user_campaign_notifications ucn
            JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
            WHERE ucn.user_id = ?
            ORDER BY ucn.delivered_at DESC
            LIMIT 10`,
            [userId]
        );

        console.log(`   API would return ${apiResult.length} notification(s)`);
        if (apiResult.length > 0) {
            const first = apiResult[0];
            console.log('   First notification data:');
            console.log('     user_notification_id:', first.user_notification_id);
            console.log('     type_key:', first.type_key);
            console.log('     collapsed_title:', first.collapsed_title);
            console.log('     collapsed_message:', first.collapsed_message);
            console.log('     collapsed_icon:', first.collapsed_icon || 'null');
            console.log('     collapsed_icon_bg_color:', first.collapsed_icon_bg_color);
        }

        // STEP 6: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log('Campaign Notification ID:', campaignNotificationId);
        console.log('User ID:', userId);
        console.log('Pending Triggers:', pendingTriggers.length);
        console.log('User Notifications:', userNotifications.length);
        console.log('API Response Count:', apiResult.length);

        if (apiResult.length > 0) {
            console.log('\n✅ SUCCESS! Campaign notification is ready for mobile app');
            console.log('   The mobile app should display this notification in the Notification Center');
            console.log('   Make sure to:');
            console.log('   1. Open the Notification Center in the app');
            console.log('   2. Pull to refresh');
            console.log('   3. Check console logs for "📢 Campaign notifications received"');
        } else {
            console.log('\n❌ ISSUE: No notifications ready for mobile app');
            console.log('   Possible causes:');
            console.log('   - Triggers not processed');
            console.log('   - User notification not created');
            console.log('   - Database query issue');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        process.exit(0);
    }
}

// Get parameters from command line
const userId = process.argv[2];
const campaignId = process.argv[3];

if (!userId || !campaignId) {
    console.error('❌ Usage: node test-campaign-flow.js <USER_ID> <CAMPAIGN_NOTIFICATION_ID>');
    console.log('\nExample: node test-campaign-flow.js 23 1');
    process.exit(1);
}

testCompleteCampaignFlow(parseInt(userId), parseInt(campaignId));
