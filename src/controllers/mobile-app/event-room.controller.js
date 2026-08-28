const { promisePool } = require('../../config/database');
const notificationService = require('../../services/notification.service');
const notificationDispatcher = require('../../services/notificationDispatcher.service');

// SSE Clients map: { eventId: [{ userId, res }] }
const clients = {};

/**
 * Broadcasts an event to all connected clients in a specific room
 */
const broadcastToRoom = (eventId, type, data) => {
    if (clients[eventId]) {
        const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
        clients[eventId].forEach(client => {
            try {
                client.res.write(payload);
            } catch (error) {
                console.error(`Failed to broadcast to client ${client.userId}:`, error);
            }
        });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/room/stream
 * Server-Sent Events (SSE) endpoint for real-time room updates
 */
exports.streamRoom = (req, res) => {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    if (!clients[eventId]) {
        clients[eventId] = [];
    }

    const client = { userId, res };
    clients[eventId].push(client);

    // Keep connection alive
    const keepAlive = setInterval(() => {
        res.write(':\n\n');
    }, 15000);

    // Notify others that someone joined
    // broadcastToRoom(eventId, 'participant_joined', { userId });

    req.on('close', () => {
        clearInterval(keepAlive);
        clients[eventId] = clients[eventId].filter(c => c !== client);
        if (clients[eventId].length === 0) {
            delete clients[eventId];
        }
        // broadcastToRoom(eventId, 'participant_left', { userId });
    });
};

/**
 * GET /api/v1/mobile-app/events/:id/room
 * Full room state (items, participants, basic info)
 */
exports.getRoomState = async (req, res) => {
    try {
        const { id: eventId } = req.params;

        const [events] = await promisePool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (!events.length) return res.status(404).json({ success: false, message: 'Event not found' });
        
        const [participants] = await promisePool.query(`
            SELECT u.id, u.full_name, u.avatar 
            FROM event_room_participants erp
            JOIN users u ON erp.user_id = u.id
            WHERE erp.event_id = ? AND erp.is_active = 1
        `, [eventId]);

        const [items] = await promisePool.query(`
            SELECT * FROM event_items 
            WHERE event_id = ? AND status != 'withdrawn'
            ORDER BY created_at DESC
        `, [eventId]);

        res.json({
            success: true,
            data: {
                event: events[0],
                participants,
                items
            }
        });
    } catch (error) {
        console.error('Error fetching room state:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/items
 */
exports.uploadItem = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.user.id;
        const { title, description, starting_price, bid_duration_minutes } = req.body;
        
        // Handle images upload here (assuming file path is in req.file/req.files)
        // For simplicity, assuming a single image URL is passed or uploaded
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

        let bidEndsAt = null;
        if (bid_duration_minutes) {
            bidEndsAt = new Date(Date.now() + bid_duration_minutes * 60000);
        }

        const [result] = await promisePool.query(`
            INSERT INTO event_items 
            (event_id, uploaded_by, title, description, images, starting_price, current_highest_bid, bid_ends_at, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [eventId, userId, title, description, JSON.stringify([imageUrl]), starting_price, starting_price, bidEndsAt]);

        const newItemId = result.insertId;

        const [newItems] = await promisePool.query('SELECT * FROM event_items WHERE id = ?', [newItemId]);
        const newItem = newItems[0];

        // Broadcast new item
        broadcastToRoom(eventId, 'new_item', newItem);

        // Add system message
        const systemMessage = `${req.user.full_name} uploaded a new item: ${title}`;
        const [msgResult] = await promisePool.query(`
            INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) 
            VALUES (?, ?, ?, 'system', 1)
        `, [eventId, userId, systemMessage]);

        broadcastToRoom(eventId, 'new_chat', {
            id: msgResult.insertId,
            sender_id: userId,
            full_name: 'System',
            message: systemMessage,
            message_type: 'system',
            is_system: 1,
            created_at: new Date()
        });

        res.json({ success: true, message: 'Item uploaded', data: { item: newItem } });
    } catch (error) {
        console.error('Error uploading item:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/room/items
 */
exports.getItems = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const [items] = await promisePool.query(`
            SELECT * FROM event_items 
            WHERE event_id = ? AND status != 'withdrawn'
            ORDER BY created_at DESC
        `, [eventId]);

        res.json({ success: true, data: { items } });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/bids
 */
exports.placeBid = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.user.id;
        const { item_id, bid_amount } = req.body;

        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // Lock the item row
            const [items] = await connection.execute(
                'SELECT * FROM event_items WHERE id = ? AND event_id = ? FOR UPDATE',
                [item_id, eventId]
            );

            if (!items.length) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Item not found' });
            }

            const item = items[0];

            if (item.status !== 'active') {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Bidding is closed for this item' });
            }

            if (item.bid_ends_at && new Date(item.bid_ends_at) < new Date()) {
                // Update status to sold if time ended
                await connection.execute('UPDATE event_items SET status = ? WHERE id = ?', ['sold', item.id]);
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Bidding time has ended' });
            }

            const bidAmountNum = parseFloat(bid_amount);
            const currentHighestBidNum = parseFloat(item.current_highest_bid || item.starting_price || 0);

            if (isNaN(bidAmountNum)) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Invalid bid amount' });
            }

            if (bidAmountNum <= currentHighestBidNum) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: `Bid must be higher than current highest bid (£${currentHighestBidNum.toFixed(2)})` });
            }

            // Unmark previous winning bid and get previous bidder
            const [prevBids] = await connection.execute(
                'SELECT bidder_id, bid_amount FROM event_bids WHERE event_item_id = ? AND is_winning_bid = 1',
                [item_id]
            );

            await connection.execute(
                'UPDATE event_bids SET is_winning_bid = 0 WHERE event_item_id = ?',
                [item_id]
            );

            // Insert new bid
            await connection.execute(`
                INSERT INTO event_bids (event_item_id, event_id, bidder_id, bid_amount, is_winning_bid) 
                VALUES (?, ?, ?, ?, 1)
            `, [item_id, eventId, userId, bid_amount]);

            // Update item
            await connection.execute(`
                UPDATE event_items SET current_highest_bid = ?, current_highest_bidder_id = ?, updated_at = NOW() 
                WHERE id = ?
            `, [bid_amount, userId, item_id]);

            await connection.commit();

            // Fetch updated item to broadcast
            const [updatedItems] = await promisePool.query('SELECT * FROM event_items WHERE id = ?', [item_id]);

            broadcastToRoom(eventId, 'new_bid', {
                item_id,
                bidder_id: userId,
                bid_amount,
                item: updatedItems[0]
            });

            // Add system chat message about bid
            const systemMessage = `${req.user.full_name} bid £${bid_amount} on ${item.title}`;
            const [msgResult] = await promisePool.query(`
                INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) 
                VALUES (?, ?, ?, 'bid_update', 1)
            `, [eventId, userId, systemMessage]);

            broadcastToRoom(eventId, 'new_chat', {
                id: msgResult.insertId,
                sender_id: userId,
                full_name: 'System',
                message: systemMessage,
                message_type: 'bid_update',
                is_system: 1,
                created_at: new Date()
            });

            // Send outbid notification if there was a previous bidder
            if (prevBids.length > 0 && prevBids[0].bidder_id !== userId) {
                const prevBidderId = prevBids[0].bidder_id;
                try {
                    const notifId = await notificationService.createNotification({
                        title: 'You have been outbid!',
                        message: `Someone placed a higher bid (£${bid_amount}) on "${item.title}". Tap to bid again!`,
                        type: 'push',
                        targetAudience: 'specific',
                        targetUserIds: [prevBidderId],
                        actionType: 'open_event',
                        actionData: { eventId, itemId: item_id },
                        createdBy: 1 // System user
                    });
                    await notificationDispatcher.dispatchNotification(notifId);
                } catch (notifErr) {
                    console.error('Failed to send outbid notification:', notifErr);
                }
            }

            res.json({ success: true, message: 'Bid placed successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/room/chat
 */
exports.getChat = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { limit = 50, before_id } = req.query;

        let query = `
            SELECT m.*, m.sender_id AS user_id, u.full_name, u.avatar 
            FROM event_room_messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.event_id = ?
        `;
        const params = [eventId];

        if (before_id) {
            query += ` AND m.id < ?`;
            params.push(before_id);
        }

        query += ` ORDER BY m.id DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [messages] = await promisePool.query(query, params);

        res.json({ success: true, data: { messages: messages.reverse() } });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/chat
 */
exports.sendChat = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.user.id;
        const { message, image_url } = req.body;
        
        if (!message && !image_url) {
            return res.status(400).json({ success: false, message: 'Message or image required' });
        }

        let messageType = 'text';
        if (image_url) messageType = 'image';

        const [result] = await promisePool.query(`
            INSERT INTO event_room_messages (event_id, sender_id, message, message_type, image_url) 
            VALUES (?, ?, ?, ?, ?)
        `, [eventId, userId, message || '', messageType, image_url || null]);

        const newMessage = {
            id: result.insertId,
            event_id: parseInt(eventId),
            sender_id: userId,
            user_id: userId,          // alias so frontend can detect own messages
            full_name: req.user.full_name,
            avatar: req.user.avatar || null,
            message: message || '',
            message_type: messageType,
            image_url: image_url || null,
            is_system: 0,
            created_at: new Date()
        };

        broadcastToRoom(eventId, 'new_chat', newMessage);

        res.json({ success: true, data: { message: newMessage } });
    } catch (error) {
        console.error('Error sending chat:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/link-product
 * Link an existing advertisement as a featured product in the event room.
 * Body: { advertisement_id: number }  OR  { product_url: string }
 */
exports.linkProduct = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const userId = req.user.id;
        let { advertisement_id, product_url } = req.body;

        // If product_url provided, try to extract the ad ID from it
        if (!advertisement_id && product_url) {
            // URL patterns: /product/123  or  /ad/123  or ends with /123
            const match = product_url.match(/\/(?:product|ad|advertisement)s?\/(\d+)/i)
                       || product_url.match(/\/(\d+)\s*$/);
            if (match) advertisement_id = parseInt(match[1]);
        }

        if (!advertisement_id || isNaN(parseInt(advertisement_id))) {
            return res.status(400).json({ success: false, message: 'Valid advertisement_id or product_url required' });
        }

        advertisement_id = parseInt(advertisement_id);

        // Fetch the advertisement
        const [ads] = await promisePool.query(`
            SELECT a.id, a.title, a.description, a.price, a.images, a.user_id
            FROM advertisements a
            WHERE a.id = ? AND a.status IN ('active', 'published', 'approved')
            LIMIT 1
        `, [advertisement_id]);

        if (!ads.length) {
            // Try without status filter in case column names differ
            const [ads2] = await promisePool.query(
                `SELECT id, title, description, price, images, user_id FROM advertisements WHERE id = ? LIMIT 1`,
                [advertisement_id]
            );
            if (!ads2.length) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            ads.push(ads2[0]);
        }

        const ad = ads[0];

        // Check if already linked in this room
        const [existing] = await promisePool.query(
            `SELECT id FROM event_items WHERE event_id = ? AND advertisement_id = ? AND status != 'withdrawn'`,
            [eventId, advertisement_id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This product is already featured in the room' });
        }

        // Insert as a featured item
        const [result] = await promisePool.query(`
            INSERT INTO event_items
            (event_id, uploaded_by, advertisement_id, title, description, images, starting_price, current_highest_bid, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            eventId,
            userId,
            advertisement_id,
            ad.title,
            ad.description || '',
            ad.images || '[]',
            ad.price || 0,
            ad.price || 0
        ]);

        const [newItems] = await promisePool.query('SELECT * FROM event_items WHERE id = ?', [result.insertId]);
        const newItem = newItems[0];

        // Broadcast to room
        broadcastToRoom(eventId, 'new_item', newItem);

        // System message
        const systemMsg = `${req.user.full_name} featured a product: ${ad.title}`;
        const [msgResult] = await promisePool.query(
            `INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) VALUES (?, ?, ?, 'system', 1)`,
            [eventId, userId, systemMsg]
        );
        broadcastToRoom(eventId, 'new_chat', {
            id: msgResult.insertId,
            event_id: parseInt(eventId),
            sender_id: userId,
            user_id: userId,
            full_name: 'System',
            message: systemMsg,
            message_type: 'system',
            is_system: 1,
            created_at: new Date()
        });

        res.json({ success: true, message: 'Product linked successfully', data: { item: newItem } });
    } catch (error) {
        console.error('Error linking product:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check for expired item bids (can be called periodically or via scheduler)
exports.resolveExpiredBids = async () => {
    try {
        const [expiredItems] = await promisePool.query(`
            SELECT id, current_highest_bidder_id, title, event_id 
            FROM event_items 
            WHERE status = 'active' AND bid_ends_at <= NOW()
        `);

        for (const item of expiredItems) {
            if (item.current_highest_bidder_id) {
                // Someone won
                await promisePool.query(`UPDATE event_items SET status = 'sold', winner_id = ? WHERE id = ?`, [item.current_highest_bidder_id, item.id]);
                
                // Add system message
                const systemMessage = `Item Sold: ${item.title} to highest bidder.`;
                const [msgResult] = await promisePool.query(`
                    INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) 
                    VALUES (?, ?, ?, 'system', 1)
                `, [item.event_id, 0, systemMessage]);

                broadcastToRoom(item.event_id, 'new_chat', {
                    id: msgResult.insertId,
                    sender_id: 0,
                    full_name: 'System',
                    message: systemMessage,
                    message_type: 'system',
                    is_system: 1,
                    created_at: new Date()
                });

                // Trigger quick-checkout flow / notification for the winner here
                // ...
            } else {
                // No bids
                await promisePool.query(`UPDATE event_items SET status = 'unsold' WHERE id = ?`, [item.id]);
            }
            
            // Broadcast item status update
            broadcastToRoom(item.event_id, 'item_updated', {
                id: item.id,
                status: item.current_highest_bidder_id ? 'sold' : 'unsold',
                winner_id: item.current_highest_bidder_id
            });
        }
    } catch (error) {
        console.error('Error resolving expired bids:', error);
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/room/item/:itemId
 * Get details of a single event item
 */
exports.getEventItemDetails = async (req, res) => {
    try {
        const { itemId } = req.params;
        const [items] = await promisePool.query('SELECT * FROM event_items WHERE id = ?', [itemId]);
        if (!items.length) {
            return res.status(404).json({ success: false, message: 'Event item not found' });
        }
        res.json({ success: true, data: items[0] });
    } catch (error) {
        console.error('Error fetching event item details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/v1/mobile-app/events/:id/room/bids
 * Return all bids for all items in this event room, enriched with bidder + item info.
 * Used by the Bids & Offers panel in the EventRoom UI.
 */
exports.getRoomBids = async (req, res) => {
    try {
        const { id: eventId } = req.params;

        const [bids] = await promisePool.query(`
            SELECT
                eb.id,
                eb.bid_amount,
                eb.is_winning_bid,
                eb.created_at,
                eb.bidder_id,
                u.full_name   AS bidder_name,
                u.avatar      AS bidder_avatar,
                ei.id         AS item_id,
                ei.title      AS item_title,
                ei.status     AS item_status,
                ei.uploaded_by AS item_owner_id,
                ei.starting_price,
                ei.current_highest_bid
            FROM event_bids eb
            JOIN users u       ON eb.bidder_id = u.id
            JOIN event_items ei ON eb.event_item_id = ei.id
            WHERE eb.event_id = ?
            ORDER BY eb.created_at DESC
            LIMIT 100
        `, [eventId]);

        res.json({ success: true, data: { bids } });
    } catch (error) {
        console.error('Error fetching room bids:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/bids/:bidId/accept
 * Item owner accepts a specific bid: marks item as sold, notifies the winner.
 */
exports.acceptBid = async (req, res) => {
    try {
        const { id: eventId, bidId } = req.params;
        const userId = req.user.id;

        // Fetch the bid and its item
        const [bids] = await promisePool.query(`
            SELECT eb.*, ei.title AS item_title, ei.uploaded_by AS item_owner_id
            FROM event_bids eb
            JOIN event_items ei ON eb.event_item_id = ei.id
            WHERE eb.id = ? AND eb.event_id = ?
        `, [bidId, eventId]);

        if (!bids.length) {
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        const bid = bids[0];

        // Only the item owner may accept
        if (bid.item_owner_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the item owner can accept bids' });
        }

        if (bid.item_status === 'sold') {
            return res.status(400).json({ success: false, message: 'This item is already sold' });
        }

        // Mark item sold with this bidder as winner
        await promisePool.query(
            `UPDATE event_items SET status = 'sold', winner_id = ?, current_highest_bidder_id = ?, updated_at = NOW() WHERE id = ?`,
            [bid.bidder_id, bid.bidder_id, bid.event_item_id]
        );

        // Mark this bid as winning, clear others
        await promisePool.query('UPDATE event_bids SET is_winning_bid = 0 WHERE event_item_id = ?', [bid.event_item_id]);
        await promisePool.query('UPDATE event_bids SET is_winning_bid = 1 WHERE id = ?', [bidId]);

        // Broadcast item sold event
        broadcastToRoom(eventId, 'item_updated', {
            id: bid.event_item_id,
            status: 'sold',
            winner_id: bid.bidder_id
        });

        // System chat message
        const sysMsg = `🎉 Offer accepted! ${bid.item_title} sold to ${bid.bidder_name || 'a bidder'} for £${bid.bid_amount}`;
        const [msgResult] = await promisePool.query(
            `INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) VALUES (?, ?, ?, 'system', 1)`,
            [eventId, userId, sysMsg]
        );
        broadcastToRoom(eventId, 'new_chat', {
            id: msgResult.insertId,
            event_id: parseInt(eventId),
            sender_id: 0,
            full_name: 'System',
            message: sysMsg,
            message_type: 'system',
            is_system: 1,
            created_at: new Date()
        });

        // Notify winning bidder
        try {
            const notifId = await notificationService.createNotification({
                title: '🎉 Your bid was accepted!',
                message: `Your bid of £${bid.bid_amount} on "${bid.item_title}" was accepted. Proceed to checkout to claim your item.`,
                type: 'push',
                targetAudience: 'specific',
                targetUserIds: [bid.bidder_id],
                actionType: 'open_event',
                actionData: { eventId, itemId: bid.event_item_id },
                createdBy: userId
            });
            await notificationDispatcher.dispatchNotification(notifId);
        } catch (notifErr) {
            console.error('Failed to notify bid winner:', notifErr);
        }

        res.json({ success: true, message: 'Bid accepted — item marked as sold' });
    } catch (error) {
        console.error('Error accepting bid:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/v1/mobile-app/events/:id/room/bids/:bidId/decline
 * Item owner declines a specific bid (bid stays but item continues accepting bids).
 */
exports.declineBid = async (req, res) => {
    try {
        const { id: eventId, bidId } = req.params;
        const userId = req.user.id;

        const [bids] = await promisePool.query(`
            SELECT eb.*, ei.title AS item_title, ei.uploaded_by AS item_owner_id
            FROM event_bids eb
            JOIN event_items ei ON eb.event_item_id = ei.id
            WHERE eb.id = ? AND eb.event_id = ?
        `, [bidId, eventId]);

        if (!bids.length) {
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        const bid = bids[0];

        if (bid.item_owner_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the item owner can decline bids' });
        }

        // Mark bid as declined (add declined column flag)
        await promisePool.query(
            `UPDATE event_bids SET is_winning_bid = 0, declined = 1 WHERE id = ?`,
            [bidId]
        );

        // System chat: subtle notification
        const sysMsg = `A bid of £${bid.bid_amount} on "${bid.item_title}" was declined. Bidding continues.`;
        const [msgResult] = await promisePool.query(
            `INSERT INTO event_room_messages (event_id, sender_id, message, message_type, is_system) VALUES (?, ?, ?, 'system', 1)`,
            [eventId, userId, sysMsg]
        );
        broadcastToRoom(eventId, 'new_chat', {
            id: msgResult.insertId,
            event_id: parseInt(eventId),
            sender_id: 0,
            full_name: 'System',
            message: sysMsg,
            message_type: 'system',
            is_system: 1,
            created_at: new Date()
        });

        // Notify the bidder
        try {
            const notifId = await notificationService.createNotification({
                title: 'Your bid was declined',
                message: `Your bid of £${bid.bid_amount} on "${bid.item_title}" was not accepted. You can place a higher bid.`,
                type: 'push',
                targetAudience: 'specific',
                targetUserIds: [bid.bidder_id],
                actionType: 'open_event',
                actionData: { eventId, itemId: bid.event_item_id },
                createdBy: userId
            });
            await notificationDispatcher.dispatchNotification(notifId);
        } catch (notifErr) {
            console.error('Failed to notify declined bidder:', notifErr);
        }

        res.json({ success: true, message: 'Bid declined' });
    } catch (error) {
        console.error('Error declining bid:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
