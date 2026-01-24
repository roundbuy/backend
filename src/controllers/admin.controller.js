const { promisePool: db } = require('../config/database');

// ==================== DASHBOARD ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM users');
    const [subscriptions] = await db.query('SELECT COUNT(*) as total FROM user_subscriptions WHERE status = "active"');
    const [advertisements] = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "published" THEN 1 ELSE 0 END) as published FROM advertisements');
    const [revenue] = await db.query('SELECT COALESCE(SUM(amount_paid), 0) as total FROM user_subscriptions WHERE status = "active"');

    // Recent activity (last 10 activities) - Fixed UNION query
    const [recentActivities] = await db.query(`
      (SELECT 'user_registration' as type, full_name as description, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5)
      UNION ALL
      (SELECT 'advertisement' as type, title as description, created_at
       FROM advertisements
       ORDER BY created_at DESC
       LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // User growth (last 12 months)
    const [userGrowth] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Revenue trends (last 12 months)
    const [revenueTrends] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(SUM(amount_paid), 0) as revenue
      FROM user_subscriptions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: users[0].total || 0,
          activeUsers: users[0].active || 0,
          activeSubscriptions: subscriptions[0].total || 0,
          totalAdvertisements: advertisements[0].total || 0,
          publishedAdvertisements: advertisements[0].published || 0,
          totalRevenue: revenue[0].total || 0
        },
        recentActivities: recentActivities || [],
        charts: {
          userGrowth: userGrowth || [],
          revenueTrends: revenueTrends || []
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

// ==================== USER MANAGEMENT ====================

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(full_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (status === 'active') {
      whereConditions.push('is_active = 1');
    } else if (status === 'inactive') {
      whereConditions.push('is_active = 0');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [users] = await db.query(
      `SELECT u.*, sp.name as subscription_name 
       FROM users u 
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id 
       ${whereClause} 
       ORDER BY u.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT u.*, sp.name as subscription_name 
       FROM users u 
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id 
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's advertisements
    const [advertisements] = await db.query(
      'SELECT * FROM advertisements WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    // Get user's subscriptions
    const [subscriptions] = await db.query(
      `SELECT us.*, sp.name as plan_name 
       FROM user_subscriptions us 
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id 
       WHERE us.user_id = ? 
       ORDER BY us.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        user: users[0],
        advertisements,
        subscriptions
      }
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role } = req.body;

    await db.query(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
      [full_name, email, phone, role, id]
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    res.json({
      success: true,
      message: is_active ? 'User activated successfully' : 'User banned successfully'
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

// ==================== SUBSCRIPTION PLANS ====================

exports.getSubscriptionPlans = async (req, res) => {
  try {
    const [plans] = await db.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription plans', error: error.message });
  }
};

exports.createSubscriptionPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      subheading,
      description,
      description_bullets,
      price,
      renewal_price,
      duration_days,
      features,
      color_hex,
      tag,
      stripe_product_id,
      stripe_price_id,
      is_active,
      sort_order
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO subscription_plans
       (name, slug, subheading, description, description_bullets, price, renewal_price,
        duration_days, features, color_hex, tag, stripe_product_id, stripe_price_id,
        is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        subheading || null,
        description,
        description_bullets ? JSON.stringify(description_bullets) : null,
        price,
        renewal_price || null,
        duration_days,
        JSON.stringify(features),
        color_hex || '#4CAF50',
        tag || null,
        stripe_product_id || null,
        stripe_price_id || null,
        is_active,
        sort_order
      ]
    );

    res.status(201).json({ success: true, message: 'Subscription plan created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create subscription plan', error: error.message });
  }
};

exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      subheading,
      description,
      description_bullets,
      price,
      renewal_price,
      duration_days,
      features,
      color_hex,
      tag,
      stripe_product_id,
      stripe_price_id,
      is_active,
      sort_order
    } = req.body;

    await db.query(
      `UPDATE subscription_plans SET
        name = ?,
        slug = ?,
        subheading = ?,
        description = ?,
        description_bullets = ?,
        price = ?,
        renewal_price = ?,
        duration_days = ?,
        features = ?,
        color_hex = ?,
        tag = ?,
        stripe_product_id = ?,
        stripe_price_id = ?,
        is_active = ?,
        sort_order = ?
       WHERE id = ?`,
      [
        name,
        slug,
        subheading || null,
        description,
        description_bullets ? JSON.stringify(description_bullets) : null,
        price,
        renewal_price || null,
        duration_days,
        JSON.stringify(features),
        color_hex || '#4CAF50',
        tag || null,
        stripe_product_id || null,
        stripe_price_id || null,
        is_active,
        sort_order,
        id
      ]
    );

    res.json({ success: true, message: 'Subscription plan updated successfully' });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription plan', error: error.message });
  }
};

exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM subscription_plans WHERE id = ?', [id]);

    res.json({ success: true, message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subscription plan', error: error.message });
  }
};

// ==================== ADVERTISEMENT PLANS ====================

exports.getAdvertisementPlans = async (req, res) => {
  try {
    const [plans] = await db.query('SELECT * FROM advertisement_plans ORDER BY created_at DESC');

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get advertisement plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisement plans', error: error.message });
  }
};

exports.createAdvertisementPlan = async (req, res) => {
  try {
    const { name, slug, description, price, duration_days, allowed_for_subscription_ids, features, is_active } = req.body;

    const [result] = await db.query(
      'INSERT INTO advertisement_plans (name, slug, description, price, duration_days, allowed_for_subscription_ids, features, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description, price, duration_days, JSON.stringify(allowed_for_subscription_ids), JSON.stringify(features), is_active]
    );

    res.status(201).json({ success: true, message: 'Advertisement plan created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create advertisement plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create advertisement plan', error: error.message });
  }
};

exports.updateAdvertisementPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, duration_days, allowed_for_subscription_ids, features, is_active } = req.body;

    await db.query(
      'UPDATE advertisement_plans SET name = ?, slug = ?, description = ?, price = ?, duration_days = ?, allowed_for_subscription_ids = ?, features = ?, is_active = ? WHERE id = ?',
      [name, slug, description, price, duration_days, JSON.stringify(allowed_for_subscription_ids), JSON.stringify(features), is_active, id]
    );

    res.json({ success: true, message: 'Advertisement plan updated successfully' });
  } catch (error) {
    console.error('Update advertisement plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update advertisement plan', error: error.message });
  }
};

exports.deleteAdvertisementPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM advertisement_plans WHERE id = ?', [id]);

    res.json({ success: true, message: 'Advertisement plan deleted successfully' });
  } catch (error) {
    console.error('Delete advertisement plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete advertisement plan', error: error.message });
  }
};

// ==================== BANNER PLANS ====================

exports.getBannerPlans = async (req, res) => {
  try {
    const [plans] = await db.query('SELECT * FROM banner_plans ORDER BY created_at DESC');

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get banner plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banner plans', error: error.message });
  }
};

exports.createBannerPlan = async (req, res) => {
  try {
    const { name, slug, description, price, duration_days, placement, dimensions, allowed_for_subscription_ids, max_clicks, is_active } = req.body;

    const [result] = await db.query(
      'INSERT INTO banner_plans (name, slug, description, price, duration_days, placement, dimensions, allowed_for_subscription_ids, max_clicks, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description, price, duration_days, placement, JSON.stringify(dimensions), JSON.stringify(allowed_for_subscription_ids), max_clicks, is_active]
    );

    res.status(201).json({ success: true, message: 'Banner plan created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create banner plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create banner plan', error: error.message });
  }
};

exports.updateBannerPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, duration_days, placement, dimensions, allowed_for_subscription_ids, max_clicks, is_active } = req.body;

    await db.query(
      'UPDATE banner_plans SET name = ?, slug = ?, description = ?, price = ?, duration_days = ?, placement = ?, dimensions = ?, allowed_for_subscription_ids = ?, max_clicks = ?, is_active = ? WHERE id = ?',
      [name, slug, description, price, duration_days, placement, JSON.stringify(dimensions), JSON.stringify(allowed_for_subscription_ids), max_clicks, is_active, id]
    );

    res.json({ success: true, message: 'Banner plan updated successfully' });
  } catch (error) {
    console.error('Update banner plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update banner plan', error: error.message });
  }
};

exports.deleteBannerPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM banner_plans WHERE id = ?', [id]);

    res.json({ success: true, message: 'Banner plan deleted successfully' });
  } catch (error) {
    console.error('Delete banner plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete banner plan', error: error.message });
  }
};

// ==================== ADVERTISEMENTS (Content Management) ====================

exports.getAdvertisements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', category = '', user_id = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    if (category) {
      whereConditions.push('a.category_id = ?');
      params.push(category);
    }

    if (user_id) {
      whereConditions.push('a.user_id = ?');
      params.push(user_id);
    }

    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [advertisements] = await db.query(
      `SELECT a.*, u.full_name as user_name, c.name as category_name 
       FROM advertisements a 
       JOIN users u ON a.user_id = u.id 
       JOIN categories c ON a.category_id = c.id 
       ${whereClause} 
       ORDER BY a.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM advertisements a ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        advertisements,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisements', error: error.message });
  }
};

exports.getAdvertisementDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [advertisements] = await db.query(
      `SELECT a.*, u.full_name as user_name, u.email as user_email, c.name as category_name 
       FROM advertisements a 
       JOIN users u ON a.user_id = u.id 
       JOIN categories c ON a.category_id = c.id 
       WHERE a.id = ?`,
      [id]
    );

    if (advertisements.length === 0) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    res.json({ success: true, data: advertisements[0] });
  } catch (error) {
    console.error('Get advertisement detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisement details', error: error.message });
  }
};

exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category_id } = req.body;

    await db.query(
      'UPDATE advertisements SET title = ?, description = ?, price = ?, category_id = ? WHERE id = ?',
      [title, description, price, category_id, id]
    );

    res.json({ success: true, message: 'Advertisement updated successfully' });
  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({ success: false, message: 'Failed to update advertisement', error: error.message });
  }
};

exports.approveAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE advertisements SET status = "published", start_date = NOW() WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Advertisement approved successfully' });
  } catch (error) {
    console.error('Approve advertisement error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve advertisement', error: error.message });
  }
};

exports.rejectAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    await db.query(
      'UPDATE advertisements SET status = "rejected", rejection_reason = ? WHERE id = ?',
      [rejection_reason, id]
    );

    res.json({ success: true, message: 'Advertisement rejected successfully' });
  } catch (error) {
    console.error('Reject advertisement error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject advertisement', error: error.message });
  }
};

exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM advertisements WHERE id = ?', [id]);

    res.json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete advertisement', error: error.message });
  }
};

// ==================== BANNERS (Content Management) ====================

exports.getBanners = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', placement = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('b.status = ?');
      params.push(status);
    }

    if (placement) {
      whereConditions.push('b.placement = ?');
      params.push(placement);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [banners] = await db.query(
      `SELECT b.*, u.full_name as user_name 
       FROM banners b 
       JOIN users u ON b.user_id = u.id 
       ${whereClause} 
       ORDER BY b.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM banners b ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
};

exports.approveBanner = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE banners SET status = "published", start_date = NOW() WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Banner approved successfully' });
  } catch (error) {
    console.error('Approve banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve banner', error: error.message });
  }
};

exports.rejectBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    await db.query(
      'UPDATE banners SET status = "rejected", rejection_reason = ? WHERE id = ?',
      [rejection_reason, id]
    );

    res.json({ success: true, message: 'Banner rejected successfully' });
  } catch (error) {
    console.error('Reject banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject banner', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM banners WHERE id = ?', [id]);

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
  }
};

// ==================== SUBSCRIPTIONS ====================

exports.getSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', plan_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('us.status = ?');
      params.push(status);
    }

    if (plan_id) {
      whereConditions.push('us.subscription_plan_id = ?');
      params.push(plan_id);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [subscriptions] = await db.query(
      `SELECT us.*, u.full_name as user_name, u.email as user_email, sp.name as plan_name 
       FROM user_subscriptions us 
       JOIN users u ON us.user_id = u.id 
       JOIN subscription_plans sp ON us.subscription_plan_id = sp.id 
       ${whereClause} 
       ORDER BY us.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM user_subscriptions us ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions', error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { end_date, status } = req.body;

    await db.query(
      'UPDATE user_subscriptions SET end_date = ?, status = ? WHERE id = ?',
      [end_date, status, id]
    );

    res.json({ success: true, message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription', error: error.message });
  }
};

// ==================== LANGUAGES ====================

exports.getLanguages = async (req, res) => {
  try {
    const [languages] = await db.query('SELECT * FROM languages ORDER BY is_default DESC, name ASC');

    res.json({ success: true, data: languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch languages', error: error.message });
  }
};

exports.createLanguage = async (req, res) => {
  try {
    const { name, code, flag_icon } = req.body;

    const [result] = await db.query(
      'INSERT INTO languages (name, code, flag_icon, is_active) VALUES (?, ?, ?, 1)',
      [name, code, flag_icon]
    );

    res.status(201).json({ success: true, message: 'Language created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create language error:', error);
    res.status(500).json({ success: false, message: 'Failed to create language', error: error.message });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, flag_icon, is_active, is_default } = req.body;

    // If setting as default, remove default from other languages
    if (is_default) {
      await db.query('UPDATE languages SET is_default = 0');
    }

    await db.query(
      'UPDATE languages SET name = ?, code = ?, flag_icon = ?, is_active = ?, is_default = ? WHERE id = ?',
      [name, code, flag_icon, is_active, is_default, id]
    );

    res.json({ success: true, message: 'Language updated successfully' });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ success: false, message: 'Failed to update language', error: error.message });
  }
};

exports.deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM languages WHERE id = ?', [id]);

    res.json({ success: true, message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete language', error: error.message });
  }
};

// ==================== TRANSLATIONS ====================

exports.getTranslationKeys = async (req, res) => {
  try {
    const { category = '' } = req.query;

    let whereClause = '';
    let params = [];

    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }

    const [keys] = await db.query(`SELECT * FROM translation_keys ${whereClause} ORDER BY category, key_name`, params);

    res.json({ success: true, data: keys });
  } catch (error) {
    console.error('Get translation keys error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch translation keys', error: error.message });
  }
};

exports.createTranslationKey = async (req, res) => {
  try {
    const { key_name, category, default_text, description } = req.body;

    const [result] = await db.query(
      'INSERT INTO translation_keys (key_name, category, default_text, description) VALUES (?, ?, ?, ?)',
      [key_name, category, default_text, description]
    );

    res.status(201).json({ success: true, message: 'Translation key created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create translation key error:', error);
    res.status(500).json({ success: false, message: 'Failed to create translation key', error: error.message });
  }
};

exports.getTranslations = async (req, res) => {
  try {
    const { language_id } = req.query;

    const [translations] = await db.query(
      `SELECT t.*, tk.key_name, tk.default_text, l.name as language_name, l.code as language_code 
       FROM translations t 
       JOIN translation_keys tk ON t.translation_key_id = tk.id 
       JOIN languages l ON t.language_id = l.id 
       WHERE t.language_id = ? 
       ORDER BY tk.category, tk.key_name`,
      [language_id]
    );

    res.json({ success: true, data: translations });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch translations', error: error.message });
  }
};

exports.updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { translated_text } = req.body;

    await db.query(
      'UPDATE translations SET translated_text = ?, is_auto_translated = 0, modified_by_admin_id = ? WHERE id = ?',
      [translated_text, req.user.id, id]
    );

    res.json({ success: true, message: 'Translation updated successfully' });
  } catch (error) {
    console.error('Update translation error:', error);
    res.status(500).json({ success: false, message: 'Failed to update translation', error: error.message });
  }
};

// ==================== SETTINGS ====================

exports.getSettings = async (req, res) => {
  try {
    const { category = '' } = req.query;

    let whereClause = '';
    let params = [];

    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }

    const [settings] = await db.query(`SELECT * FROM settings ${whereClause} ORDER BY category, setting_key`, params);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings', error: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { setting_key } = req.params;
    const { setting_value } = req.body;

    await db.query(
      'UPDATE settings SET setting_value = ?, updated_by_admin_id = ? WHERE setting_key = ?',
      [setting_value, req.user.id, setting_key]
    );

    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting', error: error.message });
  }
};

exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const queries = settings.map(({ setting_key, setting_value }) => {
      return db.query(
        'UPDATE settings SET setting_value = ?, updated_by_admin_id = ? WHERE setting_key = ?',
        [setting_value, req.user.id, setting_key]
      );
    });

    await Promise.all(queries);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};

// ==================== MODERATION ====================

exports.getModerationWords = async (req, res) => {
  try {
    const { category = '', severity = '' } = req.query;

    let whereConditions = [];
    let params = [];

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (severity) {
      whereConditions.push('severity = ?');
      params.push(severity);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [words] = await db.query(
      `SELECT * FROM moderation_words ${whereClause} ORDER BY severity DESC, word ASC`,
      params
    );

    res.json({ success: true, data: words });
  } catch (error) {
    console.error('Get moderation words error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderation words', error: error.message });
  }
};

exports.createModerationWord = async (req, res) => {
  try {
    const { word, category, severity, is_active } = req.body;

    const [result] = await db.query(
      'INSERT INTO moderation_words (word, category, severity, is_active) VALUES (?, ?, ?, ?)',
      [word, category, severity, is_active]
    );

    res.status(201).json({ success: true, message: 'Moderation word created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create moderation word error:', error);
    res.status(500).json({ success: false, message: 'Failed to create moderation word', error: error.message });
  }
};

exports.updateModerationWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { word, category, severity, is_active } = req.body;

    await db.query(
      'UPDATE moderation_words SET word = ?, category = ?, severity = ?, is_active = ? WHERE id = ?',
      [word, category, severity, is_active, id]
    );

    res.json({ success: true, message: 'Moderation word updated successfully' });
  } catch (error) {
    console.error('Update moderation word error:', error);
    res.status(500).json({ success: false, message: 'Failed to update moderation word', error: error.message });
  }
};

exports.deleteModerationWord = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM moderation_words WHERE id = ?', [id]);

    res.json({ success: true, message: 'Moderation word deleted successfully' });
  } catch (error) {
    console.error('Delete moderation word error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete moderation word', error: error.message });
  }
};

exports.getModerationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', content_type = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('mq.status = ?');
      params.push(status);
    }

    if (content_type) {
      whereConditions.push('mq.content_type = ?');
      params.push(content_type);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [queue] = await db.query(
      `SELECT mq.*, u.full_name as user_name 
       FROM moderation_queue mq 
       JOIN users u ON mq.user_id = u.id 
       ${whereClause} 
       ORDER BY mq.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM moderation_queue mq ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        queue,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderation queue', error: error.message });
  }
};

exports.reviewModerationItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    await db.query(
      'UPDATE moderation_queue SET status = ?, review_notes = ?, reviewed_by_admin_id = ?, reviewed_at = NOW() WHERE id = ?',
      [status, review_notes, req.user.id, id]
    );

    res.json({ success: true, message: 'Moderation item reviewed successfully' });
  } catch (error) {
    console.error('Review moderation item error:', error);
    res.status(500).json({ success: false, message: 'Failed to review moderation item', error: error.message });
  }
};

// ==================== CURRENCIES ====================

exports.getCurrencies = async (req, res) => {
  try {
    const [currencies] = await db.query('SELECT * FROM currencies ORDER BY is_default DESC, name ASC');

    res.json({ success: true, data: currencies });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch currencies', error: error.message });
  }
};

exports.createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchange_rate, is_active } = req.body;

    const [result] = await db.query(
      'INSERT INTO currencies (code, name, symbol, exchange_rate, is_active) VALUES (?, ?, ?, ?, ?)',
      [code, name, symbol, exchange_rate || 1.0, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({ success: true, message: 'Currency created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create currency error:', error);
    res.status(500).json({ success: false, message: 'Failed to create currency', error: error.message });
  }
};

exports.updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, exchange_rate, is_active, is_default } = req.body;

    // If setting as default, remove default from other currencies
    if (is_default) {
      await db.query('UPDATE currencies SET is_default = FALSE');
    }

    await db.query(
      'UPDATE currencies SET code = ?, name = ?, symbol = ?, exchange_rate = ?, is_active = ?, is_default = ? WHERE id = ?',
      [code, name, symbol, exchange_rate, is_active, is_default, id]
    );

    res.json({ success: true, message: 'Currency updated successfully' });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({ success: false, message: 'Failed to update currency', error: error.message });
  }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's the default currency
    const [currency] = await db.query('SELECT is_default FROM currencies WHERE id = ?', [id]);
    if (currency.length > 0 && currency[0].is_default) {
      return res.status(400).json({ success: false, message: 'Cannot delete default currency' });
    }

    await db.query('DELETE FROM currencies WHERE id = ?', [id]);

    res.json({ success: true, message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete currency', error: error.message });
  }
};

// ==================== COUNTRIES ====================

exports.getCountries = async (req, res) => {
  try {
    const [countries] = await db.query('SELECT * FROM countries ORDER BY is_default DESC, name ASC');

    res.json({ success: true, data: countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const { name, code, iso_code, phone_code, currency_code, flag_emoji, is_active } = req.body;

    const [result] = await db.query(
      'INSERT INTO countries (name, code, iso_code, phone_code, currency_code, flag_emoji, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, code, iso_code, phone_code, currency_code, flag_emoji, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({ success: true, message: 'Country created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create country error:', error);
    res.status(500).json({ success: false, message: 'Failed to create country', error: error.message });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, iso_code, phone_code, currency_code, flag_emoji, is_active, is_default } = req.body;

    // If setting as default, remove default from other countries
    if (is_default) {
      await db.query('UPDATE countries SET is_default = FALSE');
    }

    await db.query(
      'UPDATE countries SET name = ?, code = ?, iso_code = ?, phone_code = ?, currency_code = ?, flag_emoji = ?, is_active = ?, is_default = ? WHERE id = ?',
      [name, code, iso_code, phone_code, currency_code, flag_emoji, is_active, is_default, id]
    );

    res.json({ success: true, message: 'Country updated successfully' });
  } catch (error) {
    console.error('Update country error:', error);
    res.status(500).json({ success: false, message: 'Failed to update country', error: error.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's the default country
    const [country] = await db.query('SELECT is_default FROM countries WHERE id = ?', [id]);
    if (country.length > 0 && country[0].is_default) {
      return res.status(400).json({ success: false, message: 'Cannot delete default country' });
    }

    await db.query('DELETE FROM countries WHERE id = ?', [id]);

    res.json({ success: true, message: 'Country deleted successfully' });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete country', error: error.message });
  }
};

// ==================== API LOGS ====================

exports.getAPILogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, endpoint = '', method = '', status_code = '', user_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (endpoint) {
      whereConditions.push('endpoint LIKE ?');
      params.push(`%${endpoint}%`);
    }

    if (method) {
      whereConditions.push('method = ?');
      params.push(method);
    }

    if (status_code) {
      whereConditions.push('status_code = ?');
      params.push(status_code);
    }

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [logs] = await db.query(
      `SELECT * FROM api_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [total] = await db.query(`SELECT COUNT(*) as count FROM api_logs ${whereClause}`, params);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get API logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API logs', error: error.message });
  }
};

exports.getAPILogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [logs] = await db.query('SELECT * FROM api_logs WHERE id = ?', [id]);

    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: 'API log not found' });
    }

    res.json({ success: true, data: logs[0] });
  } catch (error) {
    console.error('Get API log detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API log details', error: error.message });
  }
};

// ==================== CATEGORIES ====================

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, parent_id, icon, description, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, parent_id, icon, description, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, slug, parent_id || null, icon || null, description || null, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Category created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, parent_id, icon, description, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE categories SET name = ?, slug = ?, parent_id = ?, icon = ?, description = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, parent_id || null, icon || null, description || null, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has subcategories
    const [subcategories] = await db.query('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [id]);
    if (subcategories[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with subcategories' });
    }

    // Check if category is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE category_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category that is used in advertisements' });
    }

    await db.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
  }
};

// ==================== AD ACTIVITIES ====================

exports.getAdActivities = async (req, res) => {
  try {
    const [activities] = await db.query('SELECT * FROM ad_activities ORDER BY sort_order ASC');

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get ad activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad activities', error: error.message });
  }
};

exports.createAdActivity = async (req, res) => {
  try {
    const { name, slug, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_activities (name, slug, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [name, slug, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad activity created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad activity', error: error.message });
  }
};

exports.updateAdActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_activities SET name = ?, slug = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad activity updated successfully' });
  } catch (error) {
    console.error('Update ad activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad activity', error: error.message });
  }
};

exports.deleteAdActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if activity is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE activity_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete activity that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_activities WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad activity deleted successfully' });
  } catch (error) {
    console.error('Delete ad activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad activity', error: error.message });
  }
};

// ==================== AD CONDITIONS ====================

exports.getAdConditions = async (req, res) => {
  try {
    const [conditions] = await db.query('SELECT * FROM ad_conditions ORDER BY sort_order ASC');

    res.json({ success: true, data: conditions });
  } catch (error) {
    console.error('Get ad conditions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad conditions', error: error.message });
  }
};

exports.createAdCondition = async (req, res) => {
  try {
    const { name, slug, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_conditions (name, slug, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [name, slug, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad condition created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad condition error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad condition', error: error.message });
  }
};

exports.updateAdCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_conditions SET name = ?, slug = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad condition updated successfully' });
  } catch (error) {
    console.error('Update ad condition error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad condition', error: error.message });
  }
};

exports.deleteAdCondition = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if condition is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE condition_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete condition that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_conditions WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad condition deleted successfully' });
  } catch (error) {
    console.error('Delete ad condition error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad condition', error: error.message });
  }
};

// ==================== AD AGES ====================

exports.getAdAges = async (req, res) => {
  try {
    const [ages] = await db.query('SELECT * FROM ad_ages ORDER BY sort_order ASC');

    res.json({ success: true, data: ages });
  } catch (error) {
    console.error('Get ad ages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad ages', error: error.message });
  }
};

exports.createAdAge = async (req, res) => {
  try {
    const { name, slug, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_ages (name, slug, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [name, slug, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad age created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad age error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad age', error: error.message });
  }
};

exports.updateAdAge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_ages SET name = ?, slug = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad age updated successfully' });
  } catch (error) {
    console.error('Update ad age error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad age', error: error.message });
  }
};

exports.deleteAdAge = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if age is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE age_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete age that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_ages WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad age deleted successfully' });
  } catch (error) {
    console.error('Delete ad age error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad age', error: error.message });
  }
};

// ==================== AD GENDERS ====================

exports.getAdGenders = async (req, res) => {
  try {
    const [genders] = await db.query('SELECT * FROM ad_genders ORDER BY sort_order ASC');

    res.json({ success: true, data: genders });
  } catch (error) {
    console.error('Get ad genders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad genders', error: error.message });
  }
};

exports.createAdGender = async (req, res) => {
  try {
    const { name, slug, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_genders (name, slug, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [name, slug, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad gender created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad gender error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad gender', error: error.message });
  }
};

exports.updateAdGender = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_genders SET name = ?, slug = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad gender updated successfully' });
  } catch (error) {
    console.error('Update ad gender error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad gender', error: error.message });
  }
};

exports.deleteAdGender = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if gender is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE gender_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete gender that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_genders WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad gender deleted successfully' });
  } catch (error) {
    console.error('Delete ad gender error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad gender', error: error.message });
  }
};

// ==================== AD SIZES ====================

exports.getAdSizes = async (req, res) => {
  try {
    const [sizes] = await db.query(`
      SELECT s.*, g.name as gender_name 
      FROM ad_sizes s 
      LEFT JOIN ad_genders g ON s.gender_id = g.id 
      ORDER BY s.sort_order ASC
    `);

    res.json({ success: true, data: sizes });
  } catch (error) {
    console.error('Get ad sizes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad sizes', error: error.message });
  }
};

exports.createAdSize = async (req, res) => {
  try {
    const { name, slug, gender_id, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_sizes (name, slug, gender_id, is_active, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, slug, gender_id || null, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad size created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad size error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad size', error: error.message });
  }
};

exports.updateAdSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, gender_id, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_sizes SET name = ?, slug = ?, gender_id = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, gender_id || null, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad size updated successfully' });
  } catch (error) {
    console.error('Update ad size error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad size', error: error.message });
  }
};

exports.deleteAdSize = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if size is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE size_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete size that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_sizes WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad size deleted successfully' });
  } catch (error) {
    console.error('Delete ad size error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad size', error: error.message });
  }
};

// ==================== AD COLORS ====================

exports.getAdColors = async (req, res) => {
  try {
    const [colors] = await db.query('SELECT * FROM ad_colors ORDER BY sort_order ASC');

    res.json({ success: true, data: colors });
  } catch (error) {
    console.error('Get ad colors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ad colors', error: error.message });
  }
};

exports.createAdColor = async (req, res) => {
  try {
    const { name, slug, hex_code, is_active, sort_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO ad_colors (name, slug, hex_code, is_active, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, slug, hex_code || null, is_active !== undefined ? is_active : true, sort_order || 0]
    );

    res.status(201).json({ success: true, message: 'Ad color created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create ad color error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ad color', error: error.message });
  }
};

exports.updateAdColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, hex_code, is_active, sort_order } = req.body;

    await db.query(
      'UPDATE ad_colors SET name = ?, slug = ?, hex_code = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, slug, hex_code || null, is_active, sort_order || 0, id]
    );

    res.json({ success: true, message: 'Ad color updated successfully' });
  } catch (error) {
    console.error('Update ad color error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ad color', error: error.message });
  }
};

exports.deleteAdColor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if color is used in advertisements
    const [advertisements] = await db.query('SELECT COUNT(*) as count FROM advertisements WHERE color_id = ?', [id]);
    if (advertisements[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete color that is used in advertisements' });
    }

    await db.query('DELETE FROM ad_colors WHERE id = ?', [id]);

    res.json({ success: true, message: 'Ad color deleted successfully' });
  } catch (error) {
    console.error('Delete ad color error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ad color', error: error.message });
  }
};