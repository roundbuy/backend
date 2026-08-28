const { promisePool } = require('../../config/database');

// Get user's favorites
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get favorites with advertisement details
    const [favorites] = await promisePool.query(`
      SELECT
        f.id as favorite_id,
        f.created_at as favorited_at,
        a.id,
        a.title,
        a.description,
        a.price,
        a.images,
        a.status,
        a.views_count,
        a.featured,
        a.created_at,
        c.name as category_name,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        loc.city,
        loc.country
      FROM favorites f
      JOIN advertisements a ON f.advertisement_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN user_locations loc ON a.location_id = loc.id
      WHERE f.user_id = ? AND a.status IN ('published', 'sold')
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    // Get total count
    const [countResult] = await promisePool.query(`
      SELECT COUNT(*) as total
      FROM favorites f
      JOIN advertisements a ON f.advertisement_id = a.id
      WHERE f.user_id = ? AND a.status IN ('published', 'sold')
    `, [userId]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        favorites,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message
    });
  }
};

// Add advertisement to favorites
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { advertisement_id } = req.body;

    // Validate advertisement exists and is published
    const [adCheck] = await promisePool.query(`
      SELECT id, status FROM advertisements
      WHERE id = ? AND status IN ('published', 'sold')
    `, [advertisement_id]);

    if (adCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found or not available'
      });
    }

    // Check if already in favorites
    const [existing] = await promisePool.query(`
      SELECT id FROM favorites
      WHERE user_id = ? AND advertisement_id = ?
    `, [userId, advertisement_id]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Advertisement already in favorites'
      });
    }

    // Add to favorites
    const [result] = await promisePool.query(`
      INSERT INTO favorites (user_id, advertisement_id)
      VALUES (?, ?)
    `, [userId, advertisement_id]);

    res.status(201).json({
      success: true,
      message: 'Added to favorites successfully',
      data: {
        favorite_id: result.insertId,
        advertisement_id
      }
    });

  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { advertisement_id } = req.params;

    // Check if favorite exists and belongs to user
    const [favorite] = await promisePool.query(`
      SELECT id FROM favorites
      WHERE user_id = ? AND advertisement_id = ?
    `, [userId, advertisement_id]);

    if (favorite.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Remove from favorites
    await promisePool.query(`
      DELETE FROM favorites
      WHERE user_id = ? AND advertisement_id = ?
    `, [userId, advertisement_id]);

    res.json({
      success: true,
      message: 'Removed from favorites successfully'
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
};

// Check if advertisement is in user's favorites
const checkFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { advertisement_id } = req.params;

    const [favorite] = await promisePool.query(`
      SELECT id FROM favorites
      WHERE user_id = ? AND advertisement_id = ?
    `, [userId, advertisement_id]);

    res.json({
      success: true,
      data: {
        is_favorited: favorite.length > 0,
        favorite_id: favorite.length > 0 ? favorite[0].id : null
      }
    });

  } catch (error) {
    console.error('Check favorite status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus
};