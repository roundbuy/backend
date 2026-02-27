const { promisePool } = require('../../config/database');

// Create a new offer
const createOffer = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const userId = req.user.id;
    const { advertisementId, price, message } = req.body;

    if (!advertisementId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing advertisement ID or price'
      });
    }

    await connection.beginTransaction();

    // Check if advertisement exists
    const [ads] = await connection.execute(
      'SELECT *, user_id as seller_id FROM advertisements WHERE id = ? FOR UPDATE',
      [advertisementId]
    );

    if (ads.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const ad = ads[0];

    if (ad.seller_id === userId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot make an offer on your own item'
      });
    }

    // Check if offer already exists (pending)
    const [existing] = await connection.execute(
      'SELECT id FROM offers WHERE advertisement_id = ? AND buyer_id = ? AND status = "pending"',
      [advertisementId, userId]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You already have a pending offer for this item'
      });
    }

    // Create offer
    // sender_id is the creator of the offer (buyer)
    const [result] = await connection.execute(
      `INSERT INTO offers 
       (advertisement_id, buyer_id, seller_id, sender_id, offered_price, message, status, currency_code)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'GBP')`,
      [advertisementId, userId, ad.seller_id, userId, price, message]
    );

    await connection.commit();

    // Notify Seller
    try {
      await promisePool.execute(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ad.seller_id,
          'popup', // 'offer' type? Using popup generic
          'New Offer',
          `You received a new offer of £${price} for "${ad.title}"`,
          JSON.stringify({
            offer_id: result.insertId,
            advertisement_id: advertisementId,
            action: 'new_offer'
          }),
          false
        ]
      );
    } catch (e) {
      console.error('Notification error', e);
    }

    res.status(201).json({
      success: true,
      message: 'Offer sent successfully',
      offer_id: result.insertId
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create offer'
    });
  } finally {
    if (connection) connection.release();
  }
};

// Get all offers for the current user (as buyer or seller)
const getUserOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    console.log('=== GET USER OFFERS ===');
    console.log('userId:', userId);
    console.log('type:', type);
    console.log('status:', status);
    console.log('page:', page, 'limit:', limit, 'offset:', offset);

    let whereConditions = [];
    let queryParams = [];

    // Filter by type (buyer/seller/all)
    if (type === 'buyer') {
      whereConditions.push('o.buyer_id = ?');
      queryParams.push(userId);
    } else if (type === 'seller') {
      whereConditions.push('o.seller_id = ?');
      queryParams.push(userId);
    } else {
      whereConditions.push('(o.buyer_id = ? OR o.seller_id = ?)');
      queryParams.push(userId, userId);
    }

    // Filter by status if provided
    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    console.log('WHERE clause:', whereClause);
    console.log('Query params:', queryParams);

    // DEBUG: Check raw offers without JOINs
    const [rawOffers] = await promisePool.execute(`
      SELECT o.*, 
             o.advertisement_id, 
             o.buyer_id, 
             o.seller_id, 
             o.sender_id
      FROM offers o
      ${whereClause}
      LIMIT 5
    `, queryParams);
    console.log('=== RAW OFFERS (no JOINs) ===');
    console.log('Raw offers found:', rawOffers.length);
    if (rawOffers.length > 0) {
      console.log('First raw offer:', rawOffers[0]);

      // Check which JOINs are failing
      const offer = rawOffers[0];

      // Check advertisement
      const [adCheck] = await promisePool.execute(
        'SELECT id, title FROM advertisements WHERE id = ?',
        [offer.advertisement_id]
      );
      console.log(`Advertisement ${offer.advertisement_id} exists:`, adCheck.length > 0, adCheck[0]);

      // Check buyer
      const [buyerCheck] = await promisePool.execute(
        'SELECT id, full_name FROM users WHERE id = ?',
        [offer.buyer_id]
      );
      console.log(`Buyer ${offer.buyer_id} exists:`, buyerCheck.length > 0, buyerCheck[0]);

      // Check seller
      const [sellerCheck] = await promisePool.execute(
        'SELECT id, full_name FROM users WHERE id = ?',
        [offer.seller_id]
      );
      console.log(`Seller ${offer.seller_id} exists:`, sellerCheck.length > 0, sellerCheck[0]);

      // Check sender
      const [senderCheck] = await promisePool.execute(
        'SELECT id, full_name FROM users WHERE id = ?',
        [offer.sender_id]
      );
      console.log(`Sender ${offer.sender_id} exists:`, senderCheck.length > 0, senderCheck[0]);

      // Test the full JOIN query with explicit values
      console.log('=== TESTING FULL JOIN WITH EXPLICIT VALUES ===');
      const [testQuery] = await promisePool.execute(`
        SELECT 
          o.*,
          a.title as advertisement_title,
          buyer.full_name as buyer_name,
          seller.full_name as seller_name,
          sender.full_name as sender_name
        FROM offers o
        LEFT JOIN advertisements a ON o.advertisement_id = a.id
        JOIN users buyer ON o.buyer_id = buyer.id
        JOIN users seller ON o.seller_id = seller.id
        JOIN users sender ON o.sender_id = sender.id
        WHERE o.id = ?
      `, [offer.id]);
      console.log('Test query result:', testQuery.length, testQuery[0] ? 'SUCCESS' : 'FAILED');
      if (testQuery[0]) {
        console.log('Test offer data:', {
          id: testQuery[0].id,
          advertisement_title: testQuery[0].advertisement_title,
          buyer_name: testQuery[0].buyer_name,
          seller_name: testQuery[0].seller_name,
          sender_name: testQuery[0].sender_name
        });
      }

      // Test with the EXACT same WHERE clause as main query
      console.log('=== TESTING WITH SAME WHERE CLAUSE ===');
      const [testWhere] = await promisePool.execute(`
        SELECT 
          o.*,
          a.title as advertisement_title,
          buyer.full_name as buyer_name
        FROM offers o
        LEFT JOIN advertisements a ON o.advertisement_id = a.id
        JOIN users buyer ON o.buyer_id = buyer.id
        JOIN users seller ON o.seller_id = seller.id
        JOIN users sender ON o.sender_id = sender.id
        ${whereClause}
        LIMIT 5
      `, queryParams);
      console.log('Test WHERE query result:', testWhere.length);
      if (testWhere.length > 0) {
        console.log('Test WHERE offer:', testWhere[0]);
      }
    }

    // Get offers with advertisement and user details
    // Parameters for prepared statement (LIMIT/OFFSET will be in template literal)
    // 1. CASE WHEN placeholders (in SELECT clause): userId, userId
    // 2. WHERE clause placeholders: from queryParams
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    const finalParams = [userId, userId, ...queryParams];

    console.log('=== MAIN QUERY PARAMS ===');
    console.log('Final params array:', finalParams);
    console.log('Params count:', finalParams.length);
    console.log('Query params (WHERE):', queryParams);
    console.log('Param types:', finalParams.map((p, i) => `[${i}] ${typeof p} = ${p}`));
    console.log('Limit/Offset:', { limit, limitNum, offset, offsetNum });

    const [offers] = await promisePool.execute(`
      SELECT 
        o.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        a.status as advertisement_status,
        buyer.full_name as buyer_name,
        buyer.avatar as buyer_avatar,
        seller.full_name as seller_name,
        seller.avatar as seller_avatar,
        sender.full_name as sender_name,
        sender.avatar as sender_avatar,
        CASE 
          WHEN o.buyer_id = ? THEN 'buyer'
          WHEN o.seller_id = ? THEN 'seller'
          ELSE 'unknown'
        END as user_role
      FROM offers o
      LEFT JOIN advertisements a ON o.advertisement_id = a.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      JOIN users sender ON o.sender_id = sender.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, finalParams);

    console.log('=== QUERY RESULTS ===');
    console.log('Offers found:', offers.length);
    console.log('Total count query params:', queryParams);
    if (offers.length > 0) {
      console.log('First offer:', JSON.stringify(offers[0], null, 2));
    }

    // Get total count
    const [countResult] = await promisePool.execute(`
      SELECT COUNT(*) as total
      FROM offers o
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;
    console.log('Total count from DB:', total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get user offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers'
    });
  }
};

// Get offers for a specific advertisement
const getAdvertisementOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { advertisementId } = req.params;

    // Verify user owns the advertisement or is a buyer
    const [adCheck] = await promisePool.execute(`
      SELECT id, user_id FROM advertisements WHERE id = ?
    `, [advertisementId]);

    if (adCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const isOwner = adCheck[0].user_id === userId;

    // Get offers
    let query;
    let params;

    if (isOwner) {
      // Owner can see all offers for their advertisement
      query = `
        SELECT 
          o.*,
          a.title as advertisement_title,
          a.price as advertisement_price,
          a.images as advertisement_images,
          a.status as advertisement_status,
          buyer.full_name as buyer_name,
          buyer.avatar as buyer_avatar,
          sender.full_name as sender_name,
          sender.avatar as sender_avatar
        FROM offers o
        LEFT JOIN advertisements a ON o.advertisement_id = a.id
        JOIN users buyer ON o.buyer_id = buyer.id
        JOIN users sender ON o.sender_id = sender.id
        WHERE o.advertisement_id = ?
        ORDER BY o.created_at DESC
      `;
      params = [advertisementId];
    } else {
      // Non-owner can only see their own offers
      query = `
        SELECT 
          o.*,
          a.title as advertisement_title,
          a.price as advertisement_price,
          a.images as advertisement_images,
          a.status as advertisement_status,
          seller.full_name as seller_name,
          seller.avatar as seller_avatar,
          sender.full_name as sender_name,
          sender.avatar as sender_avatar
        FROM offers o
        LEFT JOIN advertisements a ON o.advertisement_id = a.id
        JOIN users seller ON o.seller_id = seller.id
        JOIN users sender ON o.sender_id = sender.id
        WHERE o.advertisement_id = ? AND o.buyer_id = ?
        ORDER BY o.created_at DESC
      `;
      params = [advertisementId, userId];
    }

    const [offers] = await promisePool.execute(query, params);

    res.json({
      success: true,
      offers,
      is_owner: isOwner
    });

  } catch (error) {
    console.error('Get advertisement offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advertisement offers'
    });
  }
};

// Get offer statistics for the user
const getOfferStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stats as buyer
    const [buyerStats] = await promisePool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'counter_offered' THEN 1 ELSE 0 END) as countered
      FROM offers
      WHERE buyer_id = ?
    `, [userId]);

    // Get stats as seller
    const [sellerStats] = await promisePool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'counter_offered' THEN 1 ELSE 0 END) as countered
      FROM offers
      WHERE seller_id = ?
    `, [userId]);

    res.json({
      success: true,
      stats: {
        as_buyer: buyerStats[0],
        as_seller: sellerStats[0]
      }
    });

  } catch (error) {
    console.error('Get offer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer statistics'
    });
  }
};

// Accept an offer
const acceptOffer = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const userId = req.user.id;
    const { offerId } = req.params;

    await connection.beginTransaction();

    // Get the offer with advertisement details
    const [offers] = await connection.execute(
      `SELECT o.*, a.title as advertisement_title, a.user_id as seller_id
       FROM offers o 
       LEFT JOIN advertisements a ON o.advertisement_id = a.id 
       WHERE o.id = ? FOR UPDATE`,
      [offerId]
    );

    if (offers.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const offer = offers[0];

    // Only seller can accept
    if (offer.seller_id !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only the seller can accept this offer'
      });
    }

    // Check if already accepted
    if (offer.status === 'accepted') {
      await connection.rollback();
      return res.json({
        success: true,
        message: 'Offer already accepted'
      });
    }

    // --- AUTOMATIC FEE DEDUCTION LOGIC ---
    let paymentSuccess = false;
    let feeDetails = null;

    try {
      // 1. Get Fees
      const [fees] = await connection.execute(
        'SELECT fee_type, amount FROM pickup_fees WHERE is_active = TRUE'
      );

      let pickupFee = 0;
      let safeServiceFee = 0;

      fees.forEach(fee => {
        if (fee.fee_type === 'pickup_fee') pickupFee = parseFloat(fee.amount);
        if (fee.fee_type === 'safe_service_fee') safeServiceFee = parseFloat(fee.amount);
      });

      const totalBuyerFee = pickupFee + safeServiceFee;

      // 2. Import chargeWallet from wallet.controller (Assuming it's available)
      const { chargeWallet } = require('./wallet.controller');

      // 3. Attempt to charge Buyer
      await chargeWallet(
        connection,
        offer.buyer_id,
        totalBuyerFee,
        'offer_fee',
        offerId,
        `Fee for accepted offer #${offerId}`
      );

      paymentSuccess = true;
      feeDetails = {
        amount: totalBuyerFee,
        currency: 'GBP' // Default
      };

    } catch (paymentError) {
      console.log('Automatic fee deduction failed:', paymentError.message);
      // We continue even if payment fails, but we don't mark it as paid.
      // Notifications will handle prompting the user.
    }

    // Update offer status
    // Optional: We could store is_fee_paid in offers table if column existed
    await connection.execute(
      'UPDATE offers SET status = ? WHERE id = ?',
      ['accepted', offerId]
    );

    await connection.commit();

    // Create notification for buyer
    try {
      const notifMessage = paymentSuccess
        ? `Your offer of ${offer.currency_code || '£'}${offer.offered_price} for "${offer.advertisement_title}" has been accepted and fees paid!`
        : `Your offer of ${offer.currency_code || '£'}${offer.offered_price} for "${offer.advertisement_title}" has been accepted! Please pay the pickup fees.`;

      await promisePool.execute(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          offer.buyer_id,
          'popup',
          'Offer Accepted',
          notifMessage,
          JSON.stringify({
            offer_id: offerId,
            advertisement_id: offer.advertisement_id,
            action: 'offer_accepted',
            fee_paid: paymentSuccess
          }),
          false
        ]
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Offer accepted successfully',
      fee_paid: paymentSuccess
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Accept offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept offer'
    });
  } finally {
    if (connection) connection.release();
  }
};

// Reject/Decline an offer
const rejectOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offerId } = req.params;

    // Get the offer with advertisement details
    const [offers] = await promisePool.execute(
      `SELECT o.*, a.title as advertisement_title 
       FROM offers o 
       LEFT JOIN advertisements a ON o.advertisement_id = a.id 
       WHERE o.id = ?`,
      [offerId]
    );

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const offer = offers[0];

    // Only seller can reject
    if (offer.seller_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can reject this offer'
      });
    }

    // Update offer status
    await promisePool.execute(
      'UPDATE offers SET status = ? WHERE id = ?',
      ['rejected', offerId]
    );

    // Create notification for buyer
    try {
      await promisePool.execute(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          offer.buyer_id,
          'popup',
          'Offer Declined',
          `Your offer of ${offer.currency_code || '£'}${offer.offered_price} for "${offer.advertisement_title}" has been declined.`,
          JSON.stringify({
            offer_id: offerId,
            advertisement_id: offer.advertisement_id,
            action: 'offer_declined'
          }),
          false
        ]
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Offer rejected successfully'
    });

  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject offer'
    });
  }
};

// Buy Item (Instant)
const buyItem = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const userId = req.user.id;
    const { advertisementId } = req.body;

    if (!advertisementId) {
      return res.status(400).json({
        success: false,
        message: 'Missing advertisement ID'
      });
    }

    await connection.beginTransaction();

    // 1. Get Advertisement & Price
    const [ads] = await connection.execute(
      'SELECT *, user_id as seller_id FROM advertisements WHERE id = ? FOR UPDATE',
      [advertisementId]
    );

    if (ads.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const ad = ads[0];
    const itemPrice = parseFloat(ad.price);

    if (ad.seller_id === userId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot buy your own item'
      });
    }

    // 2. Calculate Fees
    const [fees] = await connection.execute(
      'SELECT fee_type, amount FROM pickup_fees WHERE is_active = TRUE'
    );

    let pickupFee = 0;
    let safeServiceFee = 0;

    fees.forEach(fee => {
      if (fee.fee_type === 'pickup_fee') pickupFee = parseFloat(fee.amount);
      if (fee.fee_type === 'safe_service_fee') safeServiceFee = parseFloat(fee.amount);
    });

    const totalBuyerFee = pickupFee + safeServiceFee;

    // 3. Charge Wallet & Create Offer
    const { chargeWallet } = require('./wallet.controller');

    // 3a. Create Offer (Accepted)
    const [offerResult] = await connection.execute(
      `INSERT INTO offers 
       (advertisement_id, buyer_id, seller_id, sender_id, offered_price, message, status, currency_code)
       VALUES (?, ?, ?, ?, ?, ?, 'accepted', 'GBP')`,
      [advertisementId, userId, ad.seller_id, userId, itemPrice, 'Instant Purchase via Buy Now']
    );

    const newOfferId = offerResult.insertId;

    // 3b. Attempt to Charge Wallet with Offer ID
    try {
      await chargeWallet(
        connection,
        userId,
        totalBuyerFee,
        'offer_fee',
        newOfferId,
        `Fee for purchasing item "${ad.title}"`
      );
    } catch (walletError) {
      await connection.rollback();
      if (walletError.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient wallet balance',
          required: walletError.required,
          available: walletError.available
        });
      }
      throw walletError;
    }

    await connection.commit();

    // 4. Notify Seller
    try {
      await promisePool.execute(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ad.seller_id,
          'popup',
          'Item Sold!',
          `Your item "${ad.title}" has been purchased for £${itemPrice}!`,
          JSON.stringify({
            offer_id: newOfferId,
            advertisement_id: advertisementId,
            action: 'item_sold'
          }),
          false
        ]
      );
    } catch (e) { console.error('Notification error', e); }

    res.status(200).json({
      success: true,
      message: 'Item purchased successfully',
      offer_id: newOfferId
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Buy item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase item'
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createOffer,
  getUserOffers,
  getAdvertisementOffers,
  getOfferStats,
  acceptOffer,
  rejectOffer,
  buyItem
};