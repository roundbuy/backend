const { promisePool } = require('../../config/database');

/**
 * Pickup Schedule Controller
 * Handles all pickup scheduling operations
 */

// Create a new pickup schedule
const schedulePickup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { offer_id, advertisement_id, scheduled_date, scheduled_time, description } = req.body;

        // Validate required fields
        if (!offer_id || !advertisement_id || !scheduled_date || !scheduled_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Verify the offer exists and is accepted
        const [offers] = await promisePool.execute(
            `SELECT o.*, a.user_id as seller_id 
       FROM offers o 
       JOIN advertisements a ON o.advertisement_id = a.id 
       WHERE o.id = ? AND o.status = 'accepted'`,
            [offer_id]
        );

        if (offers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found or not accepted'
            });
        }

        const offer = offers[0];

        // Verify user is the buyer
        if (offer.buyer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the buyer can schedule a pickup'
            });
        }

        // Check if pickup already exists for this offer
        const [existingPickup] = await promisePool.execute(
            'SELECT id FROM pickup_schedules WHERE offer_id = ? AND status NOT IN ("cancelled")',
            [offer_id]
        );

        if (existingPickup.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Pickup already scheduled for this offer'
            });
        }

        // Get current fees
        const [fees] = await promisePool.execute(
            'SELECT fee_type, amount, is_percentage FROM pickup_fees WHERE is_active = TRUE'
        );

        let pickupFee = 0;
        let safeServiceFee = 0;
        let buyerFee = 0;
        let itemFeePercentage = 0;

        fees.forEach(fee => {
            if (fee.fee_type === 'pickup_fee') pickupFee = parseFloat(fee.amount);
            if (fee.fee_type === 'safe_service_fee') safeServiceFee = parseFloat(fee.amount);
            if (fee.fee_type === 'buyer_fee') buyerFee = parseFloat(fee.amount);
            if (fee.fee_type === 'item_fee_percentage') itemFeePercentage = parseFloat(fee.amount);
        });

        // Get the offer price
        const offerPrice = parseFloat(offer.offered_price || 0);

        // Calculate item fee based on percentage of offer price
        const itemFee = (offerPrice * itemFeePercentage) / 100;

        // For now, no discount - can be added later based on business logic
        const itemFeeDiscount = 0;
        const finalItemFee = itemFee - itemFeeDiscount;

        const totalFee = pickupFee + safeServiceFee + buyerFee + finalItemFee;

        // Create pickup schedule
        const [result] = await promisePool.execute(
            `INSERT INTO pickup_schedules 
       (offer_id, advertisement_id, buyer_id, seller_id, scheduled_date, scheduled_time, 
        description, pickup_fee, safe_service_fee, buyer_fee, item_fee, item_fee_discount, 
        total_fee, offer_price, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
            [offer_id, advertisement_id, userId, offer.seller_id, scheduled_date, scheduled_time,
                description, pickupFee, safeServiceFee, buyerFee, finalItemFee, itemFeeDiscount,
                totalFee, offerPrice]
        );

        // Get the created pickup
        const [pickup] = await promisePool.execute(
            `SELECT ps.*, 
              a.title as advertisement_title,
              a.images as advertisement_images,
              buyer.full_name as buyer_name,
              seller.full_name as seller_name
       FROM pickup_schedules ps
       LEFT JOIN advertisements a ON ps.advertisement_id = a.id
       LEFT JOIN users buyer ON ps.buyer_id = buyer.id
       LEFT JOIN users seller ON ps.seller_id = seller.id
       WHERE ps.id = ?`,
            [result.insertId]
        );

        // Create notification for seller
        try {
            await promisePool.execute(
                `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    offer.seller_id,
                    'popup',
                    'New Pickup Scheduled',
                    `${pickup[0].buyer_name} has scheduled a pickup for ${scheduled_date}`,
                    JSON.stringify({
                        pickup_id: result.insertId,
                        offer_id: offer_id,
                        advertisement_id: advertisement_id,
                        action: 'pickup_scheduled'
                    }),
                    false
                ]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        res.status(201).json({
            success: true,
            pickup: pickup[0],
            message: 'Pickup scheduled successfully'
        });

    } catch (error) {
        console.error('Schedule pickup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule pickup'
        });
    }
};

// Get all pickups for current user
const getUserPickups = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'all', status, payment_status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        // Filter by user type (buyer/seller/all)
        if (type === 'buyer') {
            whereConditions.push('ps.buyer_id = ?');
            queryParams.push(userId);
        } else if (type === 'seller') {
            whereConditions.push('ps.seller_id = ?');
            queryParams.push(userId);
        } else {
            whereConditions.push('(ps.buyer_id = ? OR ps.seller_id = ?)');
            queryParams.push(userId, userId);
        }

        // Filter by status
        if (status) {
            whereConditions.push('ps.status = ?');
            queryParams.push(status);
        }

        // Filter by payment status
        if (payment_status) {
            whereConditions.push('ps.payment_status = ?');
            queryParams.push(payment_status);
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get pickups
        const [pickups] = await promisePool.execute(`
      SELECT 
        ps.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        buyer.full_name as buyer_name,
        buyer.avatar as buyer_avatar,
        seller.full_name as seller_name,
        seller.avatar as seller_avatar,
        COALESCE(ps.offer_price, o.offered_price, 0) as offer_price,
        CASE 
          WHEN ps.buyer_id = ? THEN 'buyer'
          WHEN ps.seller_id = ? THEN 'seller'
          ELSE 'unknown'
        END as user_role
      FROM pickup_schedules ps
      LEFT JOIN advertisements a ON ps.advertisement_id = a.id
      LEFT JOIN users buyer ON ps.buyer_id = buyer.id
      LEFT JOIN users seller ON ps.seller_id = seller.id
      LEFT JOIN offers o ON ps.offer_id = o.id
      ${whereClause}
      ORDER BY ps.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, ...queryParams, parseInt(limit), parseInt(offset)]);

        // Get total count
        const [countResult] = await promisePool.execute(`
      SELECT COUNT(*) as total
      FROM pickup_schedules ps
      ${whereClause}
    `, queryParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            pickups,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error('Get user pickups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pickups'
        });
    }
};

// Get single pickup details
const getPickupDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickupId } = req.params;

        const [pickups] = await promisePool.execute(`
      SELECT 
        ps.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        a.description as advertisement_description,
        buyer.full_name as buyer_name,
        buyer.avatar as buyer_avatar,
        buyer.email as buyer_email,
        buyer.phone as buyer_phone,
        seller.full_name as seller_name,
        seller.avatar as seller_avatar,
        seller.email as seller_email,
        seller.phone as seller_phone,
        COALESCE(ps.offer_price, o.offered_price, 0) as offer_price,
        CASE 
          WHEN ps.buyer_id = ? THEN 'buyer'
          WHEN ps.seller_id = ? THEN 'seller'
          ELSE 'unknown'
        END as user_role
      FROM pickup_schedules ps
      LEFT JOIN advertisements a ON ps.advertisement_id = a.id
      LEFT JOIN users buyer ON ps.buyer_id = buyer.id
      LEFT JOIN users seller ON ps.seller_id = seller.id
      LEFT JOIN offers o ON ps.offer_id = o.id
      WHERE ps.id = ? AND (ps.buyer_id = ? OR ps.seller_id = ?)
    `, [userId, userId, pickupId, userId, userId]);

        if (pickups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        res.json({
            success: true,
            pickup: pickups[0]
        });

    } catch (error) {
        console.error('Get pickup details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pickup details'
        });
    }
};

// Confirm pickup (seller only)
const confirmPickup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickupId } = req.params;

        // Get pickup
        const [pickups] = await promisePool.execute(
            'SELECT * FROM pickup_schedules WHERE id = ?',
            [pickupId]
        );

        if (pickups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        const pickup = pickups[0];

        // Only seller can confirm
        if (pickup.seller_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can confirm this pickup'
            });
        }

        // Check if already confirmed
        if (pickup.status === 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Pickup already confirmed'
            });
        }

        // Update status to confirmed
        await promisePool.execute(
            'UPDATE pickup_schedules SET status = ?, confirmed_at = NOW() WHERE id = ?',
            ['confirmed', pickupId]
        );

        // Create notification for buyer
        try {
            await promisePool.execute(
                `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    pickup.buyer_id,
                    'popup',
                    'Pickup Confirmed',
                    `Your pickup has been confirmed for ${pickup.scheduled_date}. Please complete the payment.`,
                    JSON.stringify({
                        pickup_id: pickupId,
                        action: 'pickup_confirmed'
                    }),
                    false
                ]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        res.json({
            success: true,
            message: 'Pickup confirmed successfully'
        });

    } catch (error) {
        console.error('Confirm pickup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm pickup'
        });
    }
};

// Reschedule pickup
const reschedulePickup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickupId } = req.params;
        const { scheduled_date, scheduled_time, reschedule_reason } = req.body;

        if (!scheduled_date || !scheduled_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get pickup
        const [pickups] = await promisePool.execute(
            'SELECT * FROM pickup_schedules WHERE id = ?',
            [pickupId]
        );

        if (pickups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        const pickup = pickups[0];

        // Verify user is buyer or seller
        if (pickup.buyer_id !== userId && pickup.seller_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reschedule this pickup'
            });
        }

        // Update pickup
        await promisePool.execute(
            `UPDATE pickup_schedules 
       SET scheduled_date = ?, scheduled_time = ?, status = 'rescheduled', 
           reschedule_count = reschedule_count + 1, reschedule_reason = ?
       WHERE id = ?`,
            [scheduled_date, scheduled_time, reschedule_reason, pickupId]
        );

        // Notify the other party
        const notifyUserId = pickup.buyer_id === userId ? pickup.seller_id : pickup.buyer_id;
        const userRole = pickup.buyer_id === userId ? 'buyer' : 'seller';

        try {
            await promisePool.execute(
                `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    notifyUserId,
                    'popup',
                    'Pickup Rescheduled',
                    `The ${userRole} has rescheduled the pickup to ${scheduled_date} at ${scheduled_time}`,
                    JSON.stringify({
                        pickup_id: pickupId,
                        action: 'pickup_rescheduled'
                    }),
                    false
                ]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        res.json({
            success: true,
            message: 'Pickup rescheduled successfully'
        });

    } catch (error) {
        console.error('Reschedule pickup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reschedule pickup'
        });
    }
};

// Cancel pickup
const cancelPickup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickupId } = req.params;
        const { cancellation_reason } = req.body;

        // Get pickup
        const [pickups] = await promisePool.execute(
            'SELECT * FROM pickup_schedules WHERE id = ?',
            [pickupId]
        );

        if (pickups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        const pickup = pickups[0];

        // Verify user is buyer or seller
        if (pickup.buyer_id !== userId && pickup.seller_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this pickup'
            });
        }

        // Update status to cancelled
        await promisePool.execute(
            'UPDATE pickup_schedules SET status = ?, reschedule_reason = ? WHERE id = ?',
            ['cancelled', cancellation_reason, pickupId]
        );

        // Notify the other party
        const notifyUserId = pickup.buyer_id === userId ? pickup.seller_id : pickup.buyer_id;

        try {
            await promisePool.execute(
                `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    notifyUserId,
                    'popup',
                    'Pickup Cancelled',
                    `The pickup scheduled for ${pickup.scheduled_date} has been cancelled.`,
                    JSON.stringify({
                        pickup_id: pickupId,
                        action: 'pickup_cancelled'
                    }),
                    false
                ]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        res.json({
            success: true,
            message: 'Pickup cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel pickup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel pickup'
        });
    }
};

// Get current pickup fees
const getPickupFees = async (req, res) => {
    try {
        const [fees] = await promisePool.execute(
            'SELECT fee_type, amount, is_percentage, currency, description FROM pickup_fees WHERE is_active = TRUE'
        );

        let pickupFee = 0;
        let safeServiceFee = 0;
        let buyerFee = 0;
        let itemFeePercentage = 0;
        let currency = 'GBP';

        fees.forEach(fee => {
            const amount = parseFloat(fee.amount);
            if (fee.fee_type === 'pickup_fee') {
                pickupFee = amount;
                currency = fee.currency;
            }
            if (fee.fee_type === 'safe_service_fee') {
                safeServiceFee = amount;
            }
            if (fee.fee_type === 'buyer_fee') {
                buyerFee = amount;
            }
            if (fee.fee_type === 'item_fee_percentage') {
                itemFeePercentage = amount;
            }
        });

        res.json({
            success: true,
            fees: {
                pickup_fee: pickupFee,
                safe_service_fee: safeServiceFee,
                buyer_fee: buyerFee,
                item_fee_percentage: itemFeePercentage,
                currency: currency,
                breakdown: fees
            }
        });

    } catch (error) {
        console.error('Get pickup fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pickup fees'
        });
    }
};

// Get unpaid pickups
const getUnpaidPickups = async (req, res) => {
    try {
        const userId = req.user.id;

        const [pickups] = await promisePool.execute(`
      SELECT 
        ps.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        COALESCE(ps.offer_price, o.offered_price, 0) as offer_price
      FROM pickup_schedules ps
      LEFT JOIN advertisements a ON ps.advertisement_id = a.id
      LEFT JOIN offers o ON ps.offer_id = o.id
      WHERE ps.buyer_id = ? AND ps.payment_status = 'unpaid' AND ps.status != 'cancelled'
      ORDER BY ps.created_at DESC
    `, [userId]);

        res.json({
            success: true,
            unpaid_pickups: pickups
        });

    } catch (error) {
        console.error('Get unpaid pickups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unpaid pickups'
        });
    }
};

// Mark pickup as completed
const completePickup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pickupId } = req.params;

        // Get pickup
        const [pickups] = await promisePool.execute(
            'SELECT * FROM pickup_schedules WHERE id = ?',
            [pickupId]
        );

        if (pickups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        const pickup = pickups[0];

        // Only seller can mark as completed
        if (pickup.seller_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can mark pickup as completed'
            });
        }

        // Update status
        await promisePool.execute(
            'UPDATE pickup_schedules SET status = ?, completed_at = NOW() WHERE id = ?',
            ['completed', pickupId]
        );

        res.json({
            success: true,
            message: 'Pickup marked as completed'
        });

    } catch (error) {
        console.error('Complete pickup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete pickup'
        });
    }
};

module.exports = {
    schedulePickup,
    getUserPickups,
    getPickupDetails,
    confirmPickup,
    reschedulePickup,
    cancelPickup,
    getPickupFees,
    getUnpaidPickups,
    completePickup
};
