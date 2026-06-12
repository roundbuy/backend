const { promisePool } = require('../../config/database');
const notificationService = require('../../services/notification.service');
const notificationDispatcher = require('../../services/notificationDispatcher.service');

/**
 * Mobile App - Events Controller
 * Note: Admin functions are partially placed here for convenience, 
 * but standard production apps might separate admin controllers.
 */

// --- USER ACTIONS ---

/**
 * GET /api/v1/mobile-app/events
 * Get events based on status filter, includes user specific subscription/follow state if authenticated
 */
exports.getAllEvents = async (req, res) => {
    try {
        const userId = req.user?.id; // Optional, might be public
        const { status = 'all', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT id, title, heading, thumbnail_url, cover_url, category_tag, 
                   start_time, end_time, status, max_participants, 
                   allow_bidding, chat_enabled, entry_fee, 
                   subscriber_count, follower_count, live_participant_count
            FROM events
            WHERE status != 'cancelled'
        `;
        const params = [];

        if (status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        query += ` ORDER BY start_time ASC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [events] = await promisePool.execute(query, params);

        // Fetch counts
        let countQuery = `SELECT COUNT(*) as total FROM events WHERE status != 'cancelled'`;
        const countParams = [];
        if (status !== 'all') {
            countQuery += ` AND status = ?`;
            countParams.push(status);
        }
        const [countResult] = await promisePool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // If user is authenticated, check their subscriptions and follows
        if (userId && events.length > 0) {
            const eventIds = events.map(e => e.id);
            const placeholders = eventIds.map(() => '?').join(',');
            
            const [subs] = await promisePool.execute(
                `SELECT event_id FROM event_subscriptions WHERE user_id = ? AND event_id IN (${placeholders})`,
                [userId, ...eventIds]
            );
            const [follows] = await promisePool.execute(
                `SELECT event_id FROM event_followers WHERE user_id = ? AND event_id IN (${placeholders})`,
                [userId, ...eventIds]
            );

            const subSet = new Set(subs.map(s => s.event_id));
            const followSet = new Set(follows.map(f => f.event_id));

            events.forEach(e => {
                e.is_subscribed = subSet.has(e.id);
                e.is_followed = followSet.has(e.id);
            });
        }

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id
 */
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const [events] = await promisePool.execute(
            `SELECT * FROM events WHERE id = ?`,
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const event = events[0];

        if (userId) {
            const [subs] = await promisePool.execute(`SELECT id FROM event_subscriptions WHERE user_id = ? AND event_id = ?`, [userId, id]);
            const [follows] = await promisePool.execute(`SELECT id FROM event_followers WHERE user_id = ? AND event_id = ?`, [userId, id]);
            
            event.is_subscribed = subs.length > 0;
            event.is_followed = follows.length > 0;
        }

        res.json({ success: true, data: { event } });
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/subscribe
 */
exports.subscribeToEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [events] = await promisePool.execute('SELECT status, max_participants, subscriber_count FROM events WHERE id = ?', [id]);
        if (!events.length) return res.status(404).json({ success: false, message: 'Event not found' });
        
        const event = events[0];
        if (event.status === 'finished' || event.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot subscribe to past or cancelled events' });
        }

        if (event.max_participants && event.subscriber_count >= event.max_participants) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }

        const [existing] = await promisePool.execute('SELECT id FROM event_subscriptions WHERE user_id = ? AND event_id = ?', [userId, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Already subscribed' });
        }

        await promisePool.execute('INSERT INTO event_subscriptions (user_id, event_id) VALUES (?, ?)', [userId, id]);
        await promisePool.execute('UPDATE events SET subscriber_count = subscriber_count + 1 WHERE id = ?', [id]);

        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Error subscribing:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/v1/mobile-app/events/:id/subscribe
 */
exports.unsubscribeFromEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await promisePool.execute('DELETE FROM event_subscriptions WHERE user_id = ? AND event_id = ?', [userId, id]);
        
        if (result.affectedRows > 0) {
            await promisePool.execute('UPDATE events SET subscriber_count = GREATEST(0, subscriber_count - 1) WHERE id = ?', [id]);
        }

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/follow
 */
exports.followEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [existing] = await promisePool.execute('SELECT id FROM event_followers WHERE user_id = ? AND event_id = ?', [userId, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Already following' });
        }

        await promisePool.execute('INSERT INTO event_followers (user_id, event_id) VALUES (?, ?)', [userId, id]);
        await promisePool.execute('UPDATE events SET follower_count = follower_count + 1 WHERE id = ?', [id]);

        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('Error following:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/v1/mobile-app/events/:id/follow
 */
exports.unfollowEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await promisePool.execute('DELETE FROM event_followers WHERE user_id = ? AND event_id = ?', [userId, id]);
        
        if (result.affectedRows > 0) {
            await promisePool.execute('UPDATE events SET follower_count = GREATEST(0, follower_count - 1) WHERE id = ?', [id]);
        }

        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/join
 */
exports.joinLiveRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [events] = await promisePool.execute(
            'SELECT status, entry_fee, start_time, end_time FROM events WHERE id = ?',
            [id]
        );
        if (!events.length) return res.status(404).json({ success: false, message: 'Event not found' });
        
        const event = events[0];
        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        const withinWindow = now >= startTime && now <= endTime;

        // Allow joining if status is already 'live', OR if we're within the event time window
        if (event.status === 'finished' || event.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This event has ended' });
        }
        if (event.status === 'upcoming' && !withinWindow) {
            return res.status(400).json({ success: false, message: 'Event is not live yet' });
        }

        // Auto-promote status to 'live' if within window but not yet marked
        if (withinWindow && event.status !== 'live') {
            await promisePool.execute(
                `UPDATE events SET status = 'live', updated_at = NOW() WHERE id = ?`,
                [id]
            );
        }

        // Logic for entry_fee check would go here if entry_fee > 0

        const [existing] = await promisePool.execute(
            'SELECT id, is_active FROM event_room_participants WHERE user_id = ? AND event_id = ?',
            [userId, id]
        );
        if (existing.length > 0) {
            if (!existing[0].is_active) {
                await promisePool.execute(
                    'UPDATE event_room_participants SET is_active = 1, joined_at = NOW() WHERE id = ?',
                    [existing[0].id]
                );
                await promisePool.execute(
                    'UPDATE events SET live_participant_count = live_participant_count + 1 WHERE id = ?',
                    [id]
                );
            }
        } else {
            await promisePool.execute(
                'INSERT INTO event_room_participants (user_id, event_id, is_active) VALUES (?, ?, 1)',
                [userId, id]
            );
            await promisePool.execute(
                'UPDATE events SET live_participant_count = live_participant_count + 1 WHERE id = ?',
                [id]
            );
        }

        res.json({ success: true, message: 'Joined live room' });
    } catch (error) {
        console.error('Error joining live room:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/participants
 */
exports.getLiveParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [participants] = await promisePool.execute(`
            SELECT u.id, u.full_name, u.avatar 
            FROM event_room_participants erp
            JOIN users u ON erp.user_id = u.id
            WHERE erp.event_id = ? AND erp.is_active = 1
        `, [id]);

        res.json({ success: true, data: { participants } });
    } catch (error) {
        console.error('Error fetching live participants:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- ADMIN ACTIONS ---

/**
 * POST /api/v1/mobile-app/events
 */
exports.createEvent = async (req, res) => {
    // In a real app we'd verify admin role here
    try {
        const { 
            title, heading, description, start_time, end_time, 
            category_tag, max_participants, allow_bidding, 
            chat_enabled, entry_fee, occurrence_day_1
        } = req.body;

        const [result] = await promisePool.execute(`
            INSERT INTO events (
                title, heading, description, start_time, end_time, 
                category_tag, max_participants, allow_bidding, chat_enabled, 
                entry_fee, occurrence_day_1, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
        `, [
            title, heading, description, start_time, end_time,
            category_tag, max_participants || null, allow_bidding || 1, chat_enabled || 1,
            entry_fee || 0, occurrence_day_1 || null
        ]);

        res.json({ success: true, message: 'Event created successfully', data: { event_id: result.insertId } });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /api/v1/mobile-app/events/:id
 */
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, heading, description, start_time, end_time, 
            category_tag, max_participants, allow_bidding, 
            chat_enabled, entry_fee, status 
        } = req.body;

        const [currentEventRows] = await promisePool.execute('SELECT status, title FROM events WHERE id = ?', [id]);
        const currentEvent = currentEventRows[0];

        await promisePool.execute(`
            UPDATE events SET 
                title = ?, heading = ?, description = ?, start_time = ?, end_time = ?, 
                category_tag = ?, max_participants = ?, allow_bidding = ?, 
                chat_enabled = ?, entry_fee = ?, status = COALESCE(?, status), updated_at = NOW()
            WHERE id = ?
        `, [
            title, heading, description, start_time, end_time,
            category_tag, max_participants || null, allow_bidding || 1, chat_enabled || 1,
            entry_fee || 0, status || null, id
        ]);

        if (status === 'live' && currentEvent.status !== 'live') {
            try {
                // Get all users who follow or subscribed
                const [followers] = await promisePool.execute(`
                    SELECT user_id FROM event_followers WHERE event_id = ?
                    UNION
                    SELECT user_id FROM event_subscriptions WHERE event_id = ?
                `, [id, id]);

                const userIdsToNotify = followers.map(f => f.user_id);
                
                if (userIdsToNotify.length > 0) {
                    const notifId = await notificationService.createNotification({
                        title: 'Event is Live!',
                        message: `The event "${title || currentEvent.title}" you follow is now live. Join the room now!`,
                        type: 'push',
                        targetAudience: 'specific',
                        targetUserIds: userIdsToNotify,
                        actionType: 'open_event',
                        actionData: { eventId: id },
                        createdBy: 1 // System user
                    });
                    await notificationDispatcher.dispatchNotification(notifId);
                }
            } catch (notifErr) {
                console.error('Failed to send live event notification:', notifErr);
            }
        }

        res.json({ success: true, message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/v1/mobile-app/events/:id
 */
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await promisePool.execute(`UPDATE events SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Event cancelled successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
