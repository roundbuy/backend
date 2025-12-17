const { promisePool } = require('../../config/database');

/**
 * Get offers received for user's advertisements
 * GET /api/v1/mobile-app/offers/received
 */
exports.getReceivedOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get offers where user is the seller (offers on user's ads)
    const [offers] = await promisePool.query(
      `SELECT o.*, c.advertisement_id, c.buyer_id, c.seller_id,
              a.title as ad_title, a.images as ad_images, a.price as ad_price,
              u.full_name as buyer_name, u.avatar as buyer_avatar,
              cat.name as category_name
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       JOIN advertisements a ON c.advertisement_id = a.id
       JOIN users u ON c.buyer_id = u.id
       LEFT JOIN categories cat ON a.category_id = cat.id
       WHERE c.seller_id = ? AND o.status = 'pending'
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE c.seller_id = ? AND o.status = 'pending'`,
      [userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        offers: offers.map(offer => ({
          ...offer,
          ad_images: offer.ad_images ? JSON.parse(offer.ad_images) : [],
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get received offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received offers',
      error: error.message
    });
  }
};

/**
 * Accept an offer
 * PUT /api/v1/mobile-app/offers/:id/accept
 */
exports.acceptOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if offer exists and user is the seller
    const [offers] = await promisePool.query(
      `SELECT o.*, c.seller_id, c.advertisement_id
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE o.id = ? AND c.seller_id = ? AND o.status = 'pending'`,
      [id, userId]
    );

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or not authorized'
      });
    }

    // Update offer status to accepted
    await promisePool.query(
      'UPDATE offers SET status = ?, updated_at = NOW() WHERE id = ?',
      ['accepted', id]
    );

    // Mark advertisement as sold (optional - depending on business logic)
    // await promisePool.query(
    //   'UPDATE advertisements SET status = ? WHERE id = ?',
    //   ['sold', offers[0].advertisement_id]
    // );

    res.json({
      success: true,
      message: 'Offer accepted successfully'
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting offer',
      error: error.message
    });
  }
};

/**
 * Decline an offer
 * PUT /api/v1/mobile-app/offers/:id/decline
 */
exports.declineOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if offer exists and user is the seller
    const [offers] = await promisePool.query(
      `SELECT o.*, c.seller_id
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE o.id = ? AND c.seller_id = ? AND o.status = 'pending'`,
      [id, userId]
    );

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or not authorized'
      });
    }

    // Update offer status to rejected
    await promisePool.query(
      'UPDATE offers SET status = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', id]
    );

    res.json({
      success: true,
      message: 'Offer declined successfully'
    });
  } catch (error) {
    console.error('Decline offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error declining offer',
      error: error.message
    });
  }
};

module.exports = exports;

/**
 * Get accepted offers for user (both as buyer and seller)
 * GET /api/v1/mobile-app/offers/accepted
 */
exports.getAcceptedOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get accepted offers where user is buyer or seller
    const [offers] = await promisePool.query(
      `SELECT o.*, c.advertisement_id, c.buyer_id, c.seller_id,
              a.title as ad_title, a.images as ad_images, a.price as ad_price,
              buyer.full_name as buyer_name, buyer.avatar as buyer_avatar,
              seller.full_name as seller_name, seller.avatar as seller_avatar,
              cat.name as category_name
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       JOIN advertisements a ON c.advertisement_id = a.id
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       LEFT JOIN categories cat ON a.category_id = cat.id
       WHERE (c.buyer_id = ? OR c.seller_id = ?) AND o.status = 'accepted'
       ORDER BY o.updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE (c.buyer_id = ? OR c.seller_id = ?) AND o.status = 'accepted'`,
      [userId, userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        offers: offers.map(offer => ({
          ...offer,
          ad_images: offer.ad_images ? JSON.parse(offer.ad_images) : [],
          is_buyer: offer.buyer_id === userId,
          is_seller: offer.seller_id === userId,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get accepted offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching accepted offers',
      error: error.message
    });
  }
};

/**
 * Get declined/rejected offers for user (both as buyer and seller)
 * GET /api/v1/mobile-app/offers/declined
 */
exports.getDeclinedOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get declined offers where user is buyer or seller
    const [offers] = await promisePool.query(
      `SELECT o.*, c.advertisement_id, c.buyer_id, c.seller_id,
              a.title as ad_title, a.images as ad_images, a.price as ad_price,
              buyer.full_name as buyer_name, buyer.avatar as buyer_avatar,
              seller.full_name as seller_name, seller.avatar as seller_avatar,
              cat.name as category_name
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       JOIN advertisements a ON c.advertisement_id = a.id
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       LEFT JOIN categories cat ON a.category_id = cat.id
       WHERE (c.buyer_id = ? OR c.seller_id = ?) AND o.status = 'rejected'
       ORDER BY o.updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE (c.buyer_id = ? OR c.seller_id = ?) AND o.status = 'rejected'`,
      [userId, userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        offers: offers.map(offer => ({
          ...offer,
          ad_images: offer.ad_images ? JSON.parse(offer.ad_images) : [],
          is_buyer: offer.buyer_id === userId,
          is_seller: offer.seller_id === userId,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get declined offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching declined offers',
      error: error.message
    });
  }
};

/**
 * Get offers made by user (as buyer)
 * GET /api/v1/mobile-app/offers/made
 */
exports.getMadeOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get offers made by user as buyer
    const [offers] = await promisePool.query(
      `SELECT o.*, c.advertisement_id, c.buyer_id, c.seller_id,
              a.title as ad_title, a.images as ad_images, a.price as ad_price,
              seller.full_name as seller_name, seller.avatar as seller_avatar,
              cat.name as category_name
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       JOIN advertisements a ON c.advertisement_id = a.id
       JOIN users seller ON c.seller_id = seller.id
       LEFT JOIN categories cat ON a.category_id = cat.id
       WHERE c.buyer_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total
       FROM offers o
       JOIN conversations c ON o.conversation_id = c.id
       WHERE c.buyer_id = ?`,
      [userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        offers: offers.map(offer => ({
          ...offer,
          ad_images: offer.ad_images ? JSON.parse(offer.ad_images) : [],
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get made offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching made offers',
      error: error.message
    });
  }
};