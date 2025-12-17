const { promisePool } = require('../config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await promisePool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar, u.billing_address, u.role,
              u.is_verified, u.is_active, u.language_preference, u.created_at,
              sp.name as subscription_plan_name, sp.slug as subscription_plan_slug,
              u.subscription_start_date, u.subscription_end_date
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, billing_address, language_preference } = req.body;

    // Check authorization - users can only update their own profile unless admin
    if (req.user.id != id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    await promisePool.query(
      `UPDATE users SET full_name = ?, phone = ?, billing_address = ?, language_preference = ? WHERE id = ?`,
      [full_name, phone, billing_address, language_preference || 'en', id]
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Get user's products/ads
 */
const getUserProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [products] = await promisePool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    const [countResult] = await promisePool.query(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user products',
      error: error.message
    });
  }
};

/**
 * Get user's reviews
 */
const getUserReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const [reviews] = await promisePool.query(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    const [avgRating] = await promisePool.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewed_user_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        reviews,
        average_rating: avgRating[0].average_rating || 0,
        total_reviews: avgRating[0].total_reviews
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

module.exports = {
  getUserById,
  updateUser,
  getUserProducts,
  getUserReviews
};