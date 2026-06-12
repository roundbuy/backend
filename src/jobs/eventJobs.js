const cron = require('node-cron');
const { promisePool } = require('../config/database');
const { resolveExpiredBids } = require('../controllers/mobile-app/event-room.controller');
const { createNotificationForUsers } = require('../utils/notificationHelper');

/**
 * Event Scheduler
 * Runs every minute to auto-update event statuses and send notifications
 */
function startEventScheduler() {
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Upcoming -> Live
            const [upcomingToLive] = await promisePool.execute(
                `SELECT id, title, start_time FROM events 
                 WHERE status = 'upcoming' AND start_time <= NOW() AND end_time > NOW()`
            );

            if (upcomingToLive.length > 0) {
                const eventIds = upcomingToLive.map(e => e.id);
                const placeholders = eventIds.map(() => '?').join(',');

                // Update status to 'live'
                await promisePool.execute(
                    `UPDATE events SET status = 'live', updated_at = NOW() 
                     WHERE id IN (${placeholders})`,
                    eventIds
                );

                // Notify followers that event is now live
                for (const event of upcomingToLive) {
                    const [followers] = await promisePool.execute(
                        'SELECT user_id FROM event_followers WHERE event_id = ?',
                        [event.id]
                    );

                    if (followers.length > 0) {
                        const userIds = followers.map(f => f.user_id);
                        await createNotificationForUsers(userIds, {
                            type: 'popup',
                            title: '🔴 Event Live Now!',
                            message: `"${event.title}" is now live! Join the room now.`,
                            action_data: { event_id: event.id, action: 'event_live' }
                        });
                    }
                }
                console.log(`✅ EventScheduler: Set ${upcomingToLive.length} events to LIVE`);
            }

            // 2. Live -> Finished
            const [liveToFinished] = await promisePool.execute(
                `SELECT id FROM events 
                 WHERE status = 'live' AND end_time <= NOW()`
            );

            if (liveToFinished.length > 0) {
                const eventIds = liveToFinished.map(e => e.id);
                const placeholders = eventIds.map(() => '?').join(',');

                // Update status to 'finished'
                await promisePool.execute(
                    `UPDATE events SET status = 'finished', updated_at = NOW() 
                     WHERE id IN (${placeholders})`,
                    eventIds
                );

                // Clear active room participants
                await promisePool.execute(
                    `UPDATE event_room_participants SET is_active = 0, left_at = NOW()
                     WHERE event_id IN (${placeholders}) AND is_active = 1`,
                    eventIds
                );

                console.log(`✅ EventScheduler: Set ${liveToFinished.length} events to FINISHED`);
            }

            // 3. Resolve expired item bids
            await resolveExpiredBids();
        } catch (error) {
            console.error('❌ EventScheduler Error:', error);
        }
    });

    console.log('✅ Event scheduler started (runs every minute)');
}

module.exports = { startEventScheduler };
