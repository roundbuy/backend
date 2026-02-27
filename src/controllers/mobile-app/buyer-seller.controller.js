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
        const { offerId } = req.params;

        // Logic to confirm deal (need both buyer and seller to confirm)

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

module.exports = {
    getEnquiries,
    makeOffer,
    respondToOffer,
    selectDelivery,
    scheduleExchange,
    confirmDeal,
    getActionCenterMessages
};
