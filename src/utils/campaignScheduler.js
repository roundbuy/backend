/**
 * Campaign Notification Scheduler
 * Cron job to process pending campaign notification triggers
 */

const cron = require('node-cron');
const campaignTriggerService = require('../services/campaignTrigger.service');

/**
 * Start the campaign notification scheduler
 * Runs every minute to check for pending triggers
 */
function startCampaignScheduler() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('🔄 Running campaign notification scheduler...');

        try {
            const result = await campaignTriggerService.processPendingTriggers();
            if (result.processed > 0 || result.failed > 0) {
                console.log(`✅ Processed ${result.processed} notifications, ${result.failed} failed`);
            }
        } catch (error) {
            console.error('❌ Campaign scheduler error:', error);
        }
    });

    console.log('✅ Notification scheduler started (runs every minute)');
}

module.exports = { startCampaignScheduler };
