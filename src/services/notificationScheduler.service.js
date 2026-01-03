/**
 * Notification Scheduler Service
 * 
 * Runs a cron job to check for scheduled notifications and dispatch them.
 * Runs every minute to check for notifications ready to send.
 */

const cron = require('node-cron');
const notificationService = require('./notification.service');
const dispatcherService = require('./notificationDispatcher.service');

let schedulerTask = null;
let isRunning = false;

/**
 * Start the notification scheduler
 * Runs every minute to check for scheduled notifications
 */
function startScheduler() {
    if (schedulerTask) {
        console.log('⚠️  Notification scheduler already running');
        return;
    }

    // Run every minute: '* * * * *'
    schedulerTask = cron.schedule('* * * * *', async () => {
        // Prevent overlapping executions
        if (isRunning) {
            console.log('⏭️  Scheduler already running, skipping this cycle');
            return;
        }

        isRunning = true;

        try {
            // Get notifications ready to send
            const scheduledNotifications = await notificationService.getScheduledNotifications();

            if (scheduledNotifications.length > 0) {
                console.log(`\n⏰ Found ${scheduledNotifications.length} scheduled notification(s) ready to send`);

                // Dispatch each notification
                for (const notification of scheduledNotifications) {
                    try {
                        await dispatcherService.dispatchNotification(notification.id);
                    } catch (error) {
                        console.error(`❌ Failed to dispatch notification ${notification.id}:`, error.message);
                        // Continue with next notification even if one fails
                    }
                }
            }
        } catch (error) {
            console.error('❌ Scheduler error:', error.message);
        } finally {
            isRunning = false;
        }
    });

    console.log('✅ Notification scheduler started (runs every minute)');
}

/**
 * Stop the notification scheduler
 */
function stopScheduler() {
    if (schedulerTask) {
        schedulerTask.stop();
        schedulerTask = null;
        console.log('🛑 Notification scheduler stopped');
    } else {
        console.log('⚠️  Notification scheduler is not running');
    }
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
    return {
        running: schedulerTask !== null,
        isProcessing: isRunning
    };
}

/**
 * Manually trigger scheduler check (for testing)
 */
async function triggerSchedulerCheck() {
    console.log('\n🔧 Manually triggering scheduler check...');

    try {
        const scheduledNotifications = await notificationService.getScheduledNotifications();

        if (scheduledNotifications.length === 0) {
            console.log('   No scheduled notifications ready to send');
            return {
                success: true,
                count: 0,
                message: 'No notifications to send'
            };
        }

        console.log(`   Found ${scheduledNotifications.length} notification(s) to send`);

        const results = [];
        for (const notification of scheduledNotifications) {
            try {
                const result = await dispatcherService.dispatchNotification(notification.id);
                results.push({ notificationId: notification.id, ...result });
            } catch (error) {
                results.push({
                    notificationId: notification.id,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            count: scheduledNotifications.length,
            results
        };
    } catch (error) {
        console.error('❌ Manual trigger error:', error);
        throw error;
    }
}

module.exports = {
    startScheduler,
    stopScheduler,
    getSchedulerStatus,
    triggerSchedulerCheck
};
