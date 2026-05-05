const { promisePool } = require('../../config/database');

// Gets initial Enquiries (Step 1)
const getEnquiries = async (req, res) => {
    try {
        const userId = req.user.id;
        // Logic to fetch enquiries (chats without offers)

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('getEnquiries error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
};

// Make an offer (Step 2)
const makeOffer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { advertisement_id, offered_price, message } = req.body;

        // Logic to create offer

        res.json({
            success: true,
            message: 'Offer created successfully'
        });
    } catch (error) {
        console.error('makeOffer error:', error);
        res.status(500).json({ success: false, message: 'Failed to make offer' });
    }
};

// Respond to an offer (Accept/Decline) (Step 2)
const respondToOffer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { offerId } = req.params;
        const { action } = req.body; // 'accept', 'reject'

        // Logic to update offer status

        res.json({
            success: true,
            message: `Offer ${action}ed successfully`
        });
    } catch (error) {
        console.error('respondToOffer error:', error);
        res.status(500).json({ success: false, message: 'Failed to respond to offer' });
    }
};

// Select Delivery Option (Step 3) - Placeholder logic for Courier/Shipping, real logic for Pick Up
const selectDelivery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { offerId } = req.params;
        const { delivery_type } = req.body; // 'pickup', 'shipping', 'courier'

        if (delivery_type === 'shipping' || delivery_type === 'courier') {
            return res.json({
                success: true,
                message: 'This delivery option is not available yet',
                is_available: false
            });
        }

        // Logic for setting up pickup

        res.json({
            success: true,
            message: 'Delivery selection saved',
            is_available: true
        });
    } catch (error) {
        console.error('selectDelivery error:', error);
        res.status(500).json({ success: false, message: 'Failed to select delivery' });
    }
};

// Schedule Pick Up (Step 4)
const scheduleExchange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { offerId } = req.params;
        const { scheduled_date, scheduled_time } = req.body;

        // Logic to schedule pickup

        res.json({
            success: true,
            message: 'Exchange scheduled successfully'
        });
    } catch (error) {
        console.error('scheduleExchange error:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule exchange' });
    }
};

// Confirm Deal (Step 5) - Dual confirmation logic
const confirmDeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { advertisementId } = req.params;

        // Find the order for this advertisement that isn't cancelled
        const [orderRows] = await promisePool.execute(
            'SELECT id, buyer_id, seller_id, buyer_confirmed, seller_confirmed FROM orders WHERE advertisement_id = ? AND status NOT IN ("cancelled", "refunded") LIMIT 1',
            [advertisementId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Active order not found for this item' });
        }

        const order = orderRows[0];

        let updateQuery = '';
        if (userId === order.buyer_id) {
            updateQuery = 'UPDATE orders SET buyer_confirmed = 1 WHERE id = ?';
        } else if (userId === order.seller_id) {
            updateQuery = 'UPDATE orders SET seller_confirmed = 1 WHERE id = ?';
        } else {
            return res.status(403).json({ success: false, message: 'You are not involved in this order' });
        }

        await promisePool.execute(updateQuery, [order.id]);

        res.json({
            success: true,
            message: 'Deal confirmed successfully'
        });
    } catch (error) {
        console.error('confirmDeal error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm deal' });
    }
};

// Action Center Hub
const getActionCenterMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'buying', page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const roleField = type === 'buying' ? 'c.buyer_id' : 'c.seller_id';

        // 1. Get conversations
        const [conversations] = await promisePool.execute(`
            SELECT 
                c.id as conversation_id, c.advertisement_id, c.buyer_id, c.seller_id, c.last_message_at,
                a.title as itemTitle, a.images as advertisement_images, a.price as itemPrice,
                other_user.full_name as username, other_user.avatar as userAvatar
            FROM conversations c
            JOIN advertisements a ON c.advertisement_id = a.id
            JOIN users other_user ON other_user.id = IF(c.buyer_id = ?, c.seller_id, c.buyer_id)
            WHERE ${roleField} = ?
            ORDER BY c.last_message_at DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, parseInt(limit), parseInt(offset)]);

        // Format relative time helper
        const formatTime = (dateStr) => {
            if (!dateStr) return 'now';
            const date = new Date(dateStr);
            const diff = Math.floor((new Date() - date) / 1000);
            if (diff < 60) return `${diff}s`;
            if (diff < 3600) return `${Math.floor(diff / 60)}m`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
            return `${Math.floor(diff / 86400)}d`;
        };

        // 2. Enhance with Offer and Pickup
        const actionItems = await Promise.all(conversations.map(async (conv) => {
            // Get latest offer
            const [offers] = await promisePool.execute(`
                SELECT * FROM offers WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1
            `, [conv.conversation_id]);
            const latestOffer = offers[0];

            let latestPickup = null;
            if (latestOffer && latestOffer.status === 'accepted') {
                const [pickups] = await promisePool.execute(`
                    SELECT * FROM pickup_schedules WHERE offer_id = ? ORDER BY created_at DESC LIMIT 1
                `, [latestOffer.id]);
                latestPickup = pickups[0];
            }

            // Determine Status and Step Number
            let statusText = 'Enquiry';
            let stepNumber = '1/6 Step';
            let actionText = 'Action: View Enquiry!';
            let filterCategories = ['All'];

            if (!latestOffer) {
                statusText = 'Enquiry active';
                stepNumber = '1/6 Step';
                actionText = 'Action: Provide item info!';
                filterCategories.push('Enquiry', 'Active');
            } else {
                if (latestOffer.status === 'pending') {
                    statusText = 'Offer ' + (latestOffer.currency_code || '£') + latestOffer.offered_price;
                    stepNumber = '2/6 Step';
                    actionText = type === 'buying' ? 'Action: See Offer!' : 'Action: Review Offer!';
                    filterCategories.push('Offers', 'Active', 'Unread');
                } else if (latestOffer.status === 'rejected') {
                    statusText = 'Offer Declined';
                    stepNumber = '2/6 Step';
                    actionText = 'Action: Make a new Offer!';
                    filterCategories.push('Declined');
                } else if (latestOffer.status === 'counter_offered') {
                    statusText = 'Counter Offer ' + (latestOffer.currency_code || '£') + latestOffer.offered_price;
                    stepNumber = '2/6 Step';
                    actionText = 'Action: Review Offer!';
                    filterCategories.push('Offers', 'Active');
                } else if (latestOffer.status === 'accepted') {
                    if (!latestPickup) {
                        statusText = 'Delivery Option';
                        stepNumber = '3/6 Step';
                        actionText = 'Action: Select Delivery!';
                        filterCategories.push('Offers', 'Active');
                    } else {
                        // We have a pickup schedule
                        if (latestPickup.status === 'pending') {
                            statusText = 'Schedule a Pick Up';
                            stepNumber = '4/6 Step';
                            actionText = 'Action: Schedule a Pick Up!';
                            filterCategories.push('Scheduled', 'Active');
                        } else if (latestPickup.status === 'confirmed') {
                            if (latestPickup.payment_status === 'unpaid') {
                                statusText = 'Payment Required';
                                stepNumber = '5/6 Step';
                                actionText = 'Action: Pay to confirm Deal!';
                                filterCategories.push('Scheduled', 'Active');
                            } else {
                                statusText = 'Deal Pending';
                                stepNumber = '5/6 Step';
                                actionText = 'Action: Confirm the Deal!';
                                filterCategories.push(type === 'buying' ? 'Bought' : 'Sold');
                            }
                        } else if (latestPickup.status === 'completed') {
                            statusText = 'Deal Completed';
                            stepNumber = '6/6 Step';
                            actionText = 'Action: View Deal!';
                            filterCategories.push(type === 'buying' ? 'Bought' : 'Sold', 'Finished');
                        } else if (latestPickup.status === 'cancelled') {
                            statusText = 'Schedule Cancelled';
                            stepNumber = '4/6 Step';
                            actionText = 'Action: Schedule a Pick Up!';
                            filterCategories.push('Archived');
                        }
                    }
                }
            }

            // Extract primary image
            let itemImage = null;
            try {
                const images = JSON.parse(conv.advertisement_images);
                if (images && images.length > 0) itemImage = images[0];
            } catch (e) { }

            return {
                id: conv.conversation_id.toString(),
                conversationId: conv.conversation_id,
                advertisementId: conv.advertisement_id,
                itemImage: itemImage,
                userAvatar: conv.userAvatar,
                itemTitle: conv.itemTitle,
                itemPrice: conv.itemPrice,
                username: conv.username || 'User',
                statusText,
                stepNumber,
                actionText,
                timestamp: formatTime(conv.last_message_at),
                filterCategories
            };
        }));

        res.json({
            success: true,
            data: actionItems
        });
    } catch (error) {
        console.error('getActionCenterMessages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch action center messages' });
    }
};

// Get Action Status for 6-Step Process
const getActionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        // Fetch conversation details to get buyer, seller, and advertisement
        const [convRows] = await promisePool.execute(
            'SELECT advertisement_id, buyer_id, seller_id FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (convRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const { advertisement_id, buyer_id, seller_id } = convRows[0];

        // Check if current user is buyer or seller
        const isBuyer = userId === buyer_id;

        // Initialize status object
        const status = {
            step1: false,
            step2: false,
            step3: false,
            step4: false,
            step5: false,
            step6: false,
            meta: {
                isBuyer,
                buyerId: buyer_id,
                sellerId: seller_id,
                advertisementId: advertisement_id,
                offerId: null,
                orderId: null,
                paymentMethod: null
            }
        };

        // Step 1: Enquiries (Has the user sent a specific kind of message?)
        // Rules: message contains ?, what, how, when OR if there's an image. Right now we just check the message text.
        const [msgRows] = await promisePool.execute(
            `SELECT id FROM messages WHERE conversation_id = ? AND sender_id = ? 
             AND (
                 message LIKE '%?%' OR 
                 message LIKE '%what%' OR 
                 message LIKE '%how%' OR 
                 message LIKE '%when%' OR 
                 message LIKE '%http%' OR 
                 message LIKE '%/uploads/image-%'
             ) LIMIT 1`,
            [conversationId, userId]
        );
        status.step1 = msgRows.length > 0;

        // Step 2: Offers (Does an offer exist for this conversation?)
        // (User feedback: Should be 'Done' if an offer is merely made, not just accepted)
        const [offerRows] = await promisePool.execute(
            'SELECT id FROM offers WHERE conversation_id = ? LIMIT 1',
            [conversationId]
        );
        if (offerRows.length > 0) {
            status.step2 = true;
            status.meta.offerId = offerRows[0].id;
        }

        status.meta.deliveryOption = null;

        // Step 3: Payment (Does an order exist for this advertisement and buyer?)
        const [orderRows] = await promisePool.execute(
            'SELECT id, status, payment_method, notes, buyer_confirmed, seller_confirmed FROM orders WHERE buyer_id = ? AND advertisement_id = ? AND status IN ("confirmed", "shipped", "delivered", "completed")',
            [buyer_id, advertisement_id]
        );

        if (orderRows.length > 0) {
            status.step3 = true;
            status.meta.orderId = orderRows[0].id;
            status.meta.paymentMethod = orderRows[0].payment_method;

            try {
                const parsedNotes = JSON.parse(orderRows[0].notes || '{}');
                status.meta.deliveryOption = parsedNotes.deliveryOption;
            } catch (e) {
                // Ignore parse errors if notes aren't JSON
            }

            // Step 5: Deal Confirmation (Are both buyer_confirmed and seller_confirmed true?)
            if (orderRows[0].buyer_confirmed === 1 && orderRows[0].seller_confirmed === 1) {
                status.step5 = true;
            }
        }

        // Step 4: Schedule Pickup (Does *any* active pickup schedule exist?)
        // (User feedback: Should be 'Done' if a schedule is created, even if pending)
        const [pickupRows] = await promisePool.execute(
            'SELECT id FROM pickup_schedules WHERE advertisement_id = ? AND status NOT IN ("cancelled") LIMIT 1',
            [advertisement_id]
        );
        status.step4 = pickupRows.length > 0;

        // Step 6: Give Feedback (Has the user submitted a review for this order/ad?)
        if (status.meta.orderId) {
            const [reviewRows] = await promisePool.execute(
                'SELECT id FROM reviews WHERE reviewer_id = ? AND order_id = ? LIMIT 1',
                [userId, status.meta.orderId]
            );
            status.step6 = reviewRows.length > 0;
        }

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('getActionStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch action status' });
    }
};

module.exports = {
    getEnquiries,
    makeOffer,
    respondToOffer,
    selectDelivery,
    scheduleExchange,
    confirmDeal,
    getActionCenterMessages,
    getActionStatus
};
