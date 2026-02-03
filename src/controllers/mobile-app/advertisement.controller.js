const { promisePool } = require('../../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get filter options for advertisements
 * GET /api/v1/mobile-app/advertisements/filters
 */
const getFilters = async (req, res) => {
  try {
    // Get categories with requires_size field
    const [categories] = await promisePool.query(
      'SELECT id, name, slug, size_type FROM categories WHERE parent_id IS NULL AND is_active = TRUE ORDER BY sort_order'
    );

    // Get subcategories for each category
    for (const category of categories) {
      const [subcategories] = await promisePool.query(
        'SELECT id, name, slug FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order',
        [category.id]
      );
      category.subcategories = subcategories;
    }

    // Get activities
    const [activities] = await promisePool.query(
      'SELECT id, name, slug FROM ad_activities WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get conditions
    const [conditions] = await promisePool.query(
      'SELECT id, name, slug FROM ad_conditions WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get ages
    const [ages] = await promisePool.query(
      'SELECT id, name, slug FROM ad_ages WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get genders
    const [genders] = await promisePool.query(
      'SELECT id, name, slug FROM ad_genders WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get sizes with gender_id
    const [sizes] = await promisePool.query(
      'SELECT id, name, slug, gender_id FROM ad_sizes WHERE is_active = TRUE ORDER BY sort_order'
    );

    // Get colors
    const [colors] = await promisePool.query(
      'SELECT id, name, slug, hex_code FROM ad_colors WHERE is_active = TRUE ORDER BY sort_order'
    );

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          slug: cat.slug,
          size_type: cat.size_type,
          subcategories: cat.subcategories && cat.subcategories[0]?.id ? cat.subcategories : []
        })),
        activities,
        conditions,
        ages,
        genders,
        sizes,
        colors
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

/**
 * Get user's locations
 * GET /api/v1/mobile-app/advertisements/locations
 */
const getUserLocations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [locations] = await promisePool.query(
      `SELECT id, name, street, street2, city, region, country, zip_code,
              latitude, longitude, is_default
       FROM user_locations
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        locations
      }
    });
  } catch (error) {
    console.error('Get user locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user locations',
      error: error.message
    });
  }
};

/**
 * Get advertisement plans
 * GET /api/v1/mobile-app/advertisements/plans
 */
const getAdvertisementPlans = async (req, res) => {
  try {
    const [plans] = await promisePool.query(
      'SELECT id, name, slug, plan_type, priority_level, description, price, base_price, discounted_price, duration_days, duration_label, features, distance_boost_km, allows_distance_boost FROM advertisement_plans WHERE is_active = TRUE ORDER BY sort_order ASC, price ASC'
    );

    const [distancePlans] = await promisePool.query(
      'SELECT id, name, slug, description, distance_km, is_unlimited, base_price, discounted_price FROM distance_boost_plans WHERE is_active = TRUE ORDER BY sort_order ASC'
    );

    // Parse features if they are JSON strings
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    }));

    res.json({
      success: true,
      data: {
        plans: formattedPlans,
        distance_plans: distancePlans
      }
    });
  } catch (error) {
    console.error('Get advertisement plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement plans',
      error: error.message
    });
  }
};

/**
 * Create a new advertisement
 * POST /api/v1/mobile-app/advertisements
 */
const createAdvertisement = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      images,
      category_id,
      subcategory_id,
      location_id,
      price,
      display_duration_days,
      activity_id,
      condition_id,
      age_id,
      gender_id,
      size_id,
      color_id,
      dim_length,
      dim_width,
      dim_height,
      dim_unit
    } = req.body;

    // Validate required fields
    if (!title || !description || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and price are required',
        error_code: 'VALIDATION_ERROR'
      });
    }

    // Validate category exists
    const [categories] = await promisePool.query(
      'SELECT id FROM categories WHERE id = ? AND is_active = TRUE',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Validate subcategory if provided
    if (subcategory_id) {
      const [subcategories] = await promisePool.query(
        'SELECT id FROM categories WHERE id = ? AND parent_id = ? AND is_active = TRUE',
        [subcategory_id, category_id]
      );

      if (subcategories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory for the selected category'
        });
      }
    }

    // Validate location if provided
    if (location_id) {
      const [locations] = await promisePool.query(
        'SELECT id FROM user_locations WHERE id = ? AND user_id = ? AND is_active = TRUE',
        [location_id, userId]
      );

      if (locations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location'
        });
      }
    }

    // Process images - ensure they are stored in the correct directory
    let processedImages = [];
    if (images && Array.isArray(images)) {
      // For now, assume images are already uploaded and we have URLs
      // In a real implementation, you'd handle file uploads here
      processedImages = images;
    }

    // Calculate display end date
    let endDate = null;
    if (display_duration_days && display_duration_days > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + display_duration_days);
    }

    // Create advertisement with 'published' status (auto-publish)
    const [result] = await promisePool.query(
      `INSERT INTO advertisements
       (user_id, title, description, images, category_id, subcategory_id, location_id,
        price, display_duration_days, activity_id, condition_id, age_id, gender_id,
        size_id, color_id, dim_length, dim_width, dim_height, dim_unit, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        description,
        JSON.stringify(processedImages),
        category_id,
        subcategory_id || null,
        location_id || null,
        price,
        display_duration_days || 60,
        activity_id || null,
        condition_id || null,
        age_id || null,
        gender_id || null,
        size_id || null,
        color_id || null,
        dim_length || null,
        dim_width || null,
        dim_height || null,
        dim_unit || 'cm',
        'published', new Date(), endDate
      ]
    );

    const adId = result.insertId;

    // Send notification: Ad submitted for review
    const { createNotificationForUser } = require('../../utils/notificationHelper');

    await createNotificationForUser({
      user_id: userId,
      type: 'popup',
      title: 'Advertisement Submitted',
      message: `Your ad "${title}" has been submitted for review. We'll notify you once it's published.`,
      action_type: 'open_screen',
      action_data: {
        screen: 'AdDetails',
        params: { adId }
      }
    });

    // Schedule notification for auto-publish (simulating 5-minute review)
    // In production, you might use a job queue for this
    setTimeout(async () => {
      try {
        await createNotificationForUser({
          user_id: userId,
          type: 'popup',
          title: 'Advertisement Published! 🎉',
          message: `Your ad "${title}" is now live and visible to buyers!`,
          action_type: 'open_screen',
          action_data: {
            screen: 'AdDetails',
            params: { adId }
          }
        });
      } catch (error) {
        console.error('Error sending publish notification:', error);
      }
    }, 300000); // 5 minutes

    // Get the created advertisement with full details
    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
              ul.name as location_name, ul.city, ul.country,
              act.name as activity_name, cond.name as condition_name,
              ag.name as age_name, gend.name as gender_name,
              sz.name as size_name, col.name as color_name, col.hex_code
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN ad_ages ag ON a.age_id = ag.id
       LEFT JOIN ad_genders gend ON a.gender_id = gend.id
       LEFT JOIN ad_sizes sz ON a.size_id = sz.id
       LEFT JOIN ad_colors col ON a.color_id = col.id
       WHERE a.id = ?`,
      [adId]
    );

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: {
        advertisement: ads[0]
      }
    });
  } catch (error) {
    console.error('Create advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating advertisement',
      error: error.message
    });
  }
};

/**
 * Update an advertisement
 * PUT /api/v1/mobile-app/advertisements/:id
 */
const updateAdvertisement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      title,
      description,
      images,
      category_id,
      subcategory_id,
      location_id,
      price,
      display_duration_days,
      activity_id,
      condition_id,
      age_id,
      gender_id,
      size_id,
      color_id,
      dim_length,
      dim_width,
      dim_height,
      dim_unit
    } = req.body;

    // Check if advertisement exists and belongs to user
    const [existingAds] = await promisePool.query(
      'SELECT id, status FROM advertisements WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingAds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const ad = existingAds[0];

    // Allow editing for draft, rejected, and published ads (for status changes)
    // Only allow status changes between draft and published
    const allowedStatuses = ['draft', 'rejected', 'published'];
    if (!allowedStatuses.includes(ad.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify advertisement with current status'
      });
    }

    // Validate category if provided
    if (category_id) {
      const [categories] = await promisePool.query(
        'SELECT id FROM categories WHERE id = ? AND is_active = TRUE',
        [category_id]
      );

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Calculate display end date
    let endDate = null;
    if (display_duration_days && display_duration_days > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + display_duration_days);
    }

    // Build dynamic update query to allow partial updates
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (images !== undefined) {
      updates.push('images = ?');
      params.push(images ? JSON.stringify(images) : null);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (subcategory_id !== undefined) {
      updates.push('subcategory_id = ?');
      params.push(subcategory_id);
    }
    if (location_id !== undefined) {
      updates.push('location_id = ?');
      params.push(location_id);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (display_duration_days !== undefined) {
      updates.push('display_duration_days = ?');
      params.push(display_duration_days);
    }
    if (activity_id !== undefined) {
      updates.push('activity_id = ?');
      params.push(activity_id);
    }
    if (condition_id !== undefined) {
      updates.push('condition_id = ?');
      params.push(condition_id);
    }
    if (age_id !== undefined) {
      updates.push('age_id = ?');
      params.push(age_id);
    }
    if (gender_id !== undefined) {
      updates.push('gender_id = ?');
      params.push(gender_id);
    }
    if (size_id !== undefined) {
      updates.push('size_id = ?');
      params.push(size_id);
    }
    if (color_id !== undefined) {
      updates.push('color_id = ?');
      params.push(color_id);
    }
    if (endDate !== undefined) {
      updates.push('end_date = ?');
      params.push(endDate);
    }
    if (dim_length !== undefined) {
      updates.push('dim_length = ?');
      params.push(dim_length);
    }
    if (dim_width !== undefined) {
      updates.push('dim_width = ?');
      params.push(dim_width);
    }
    if (dim_height !== undefined) {
      updates.push('dim_height = ?');
      params.push(dim_height);
    }
    if (dim_unit !== undefined) {
      updates.push('dim_unit = ?');
      params.push(dim_unit);
    }

    // Allow status changes between draft and published
    if (req.body.status) {
      const newStatus = req.body.status;
      if ((ad.status === 'draft' && newStatus === 'published') ||
        (ad.status === 'published' && newStatus === 'draft')) {
        updates.push('status = ?');
        params.push(newStatus);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update advertisement
    params.push(id, userId);
    await promisePool.query(
      `UPDATE advertisements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      params
    );

    // Get updated advertisement
    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
              ul.name as location_name, ul.city, ul.country,
              act.name as activity_name, cond.name as condition_name,
              ag.name as age_name, gend.name as gender_name,
              sz.name as size_name, col.name as color_name, col.hex_code
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN ad_ages ag ON a.age_id = ag.id
       LEFT JOIN ad_genders gend ON a.gender_id = gend.id
       LEFT JOIN ad_sizes sz ON a.size_id = sz.id
       LEFT JOIN ad_colors col ON a.color_id = col.id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: {
        advertisement: ads[0]
      }
    });
  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement',
      error: error.message
    });
  }
};

/**
 * Get user's advertisements
 * GET /api/v1/mobile-app/advertisements
 */
const getUserAdvertisements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let whereClause = 'WHERE a.user_id = ?';
    let params = [userId];

    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    const offset = (page - 1) * limit;

    // Get advertisements
    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
              ul.name as location_name, ul.city, ul.country,
              act.name as activity_name, cond.name as condition_name,
              ag.name as age_name, gend.name as gender_name,
              sz.name as size_name, col.name as color_name, col.hex_code
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN ad_ages ag ON a.age_id = ag.id
       LEFT JOIN ad_genders gend ON a.gender_id = gend.id
       LEFT JOIN ad_sizes sz ON a.size_id = sz.id
       LEFT JOIN ad_colors col ON a.color_id = col.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) as total FROM advertisements a ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        advertisements: processedAds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get user advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisements',
      error: error.message
    });
  }
};

/**
 * Get single advertisement
 * GET /api/v1/mobile-app/advertisements/:id
 */
const getAdvertisement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
              ul.name as location_name, ul.city, ul.country,
              act.name as activity_name, cond.name as condition_name,
              ag.name as age_name, gend.name as gender_name,
              sz.name as size_name, col.name as color_name, col.hex_code
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN ad_ages ag ON a.age_id = ag.id
       LEFT JOIN ad_genders gend ON a.gender_id = gend.id
       LEFT JOIN ad_sizes sz ON a.size_id = sz.id
       LEFT JOIN ad_colors col ON a.color_id = col.id
       WHERE a.id = ? AND a.user_id = ?`,
      [id, userId]
    );

    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Fetch badges separately
    const [badges] = await promisePool.query(
      `SELECT badge_type as type, badge_level as level 
       FROM product_badges 
       WHERE advertisement_id = ? AND is_active = 1`,
      [id]
    );

    console.log('Badges:', badges);

    res.json({
      success: true,
      data: {
        advertisement: {
          ...ads[0],
          badges: badges || []
        }
      }
    });
  } catch (error) {
    console.error('Get advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement',
      error: error.message
    });
  }
};

/**
 * Delete an advertisement
 * DELETE /api/v1/mobile-app/advertisements/:id
 */
const deleteAdvertisement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if advertisement exists and belongs to user
    const [existingAds] = await promisePool.query(
      'SELECT id, status FROM advertisements WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingAds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const ad = existingAds[0];

    // Only allow deletion if status is draft
    if (ad.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete advertisement with current status'
      });
    }

    // Delete advertisement
    await promisePool.query(
      'DELETE FROM advertisements WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting advertisement',
      error: error.message
    });
  }
};

/**
 * Browse/search advertisements (authenticated, requires subscription)
 * GET /api/v1/mobile-app/advertisements/browse
 */
const browseAdvertisements = async (req, res) => {
  try {
    const {
      search,
      category_id,
      subcategory_id,
      activity_id,
      condition_id,
      min_price,
      max_price,
      latitude,
      longitude,
      user_id,
      radius = 50, // km
      sort = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    let whereClause = 'WHERE a.status = "published"';
    let params = [];

    // Search query
    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // User filter
    if (user_id) {
      whereClause += ' AND a.user_id = ?';
      params.push(user_id);
    }

    // Category filter
    if (category_id) {
      whereClause += ' AND a.category_id = ?';
      params.push(category_id);
    }

    // Subcategory filter
    if (subcategory_id) {
      whereClause += ' AND a.subcategory_id = ?';
      params.push(subcategory_id);
    }

    // Activity filter
    if (activity_id) {
      whereClause += ' AND a.activity_id = ?';
      params.push(activity_id);
    }

    // Condition filter
    if (condition_id) {
      whereClause += ' AND a.condition_id = ?';
      params.push(condition_id);
    }

    // Price range filter
    if (min_price) {
      whereClause += ' AND a.price >= ?';
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      whereClause += ' AND a.price <= ?';
      params.push(parseFloat(max_price));
    }

    // Location-based search (if coordinates provided)
    let distanceSelect = '';
    if (latitude && longitude) {
      distanceSelect = `, (6371 * acos(cos(radians(?)) * cos(radians(ul.latitude)) *
        cos(radians(ul.longitude) - radians(?)) + sin(radians(?)) *
        sin(radians(ul.latitude)))) AS distance`;

      // Add distance to params (will be used later in HAVING clause)
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(latitude));
    }

    // Valid sort fields
    const validSorts = ['created_at', 'price', 'views_count', 'distance'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Build query
    let query = `
      SELECT a.*, c.name as category_name, sc.name as subcategory_name,
             ul.name as location_name, ul.city, ul.country, ul.latitude, ul.longitude,
             act.name as activity_name, cond.name as condition_name,
             ag.name as age_name, gend.name as gender_name,
             sz.name as size_name, col.name as color_name, col.hex_code,
             u.full_name as seller_name, u.id as seller_id,
             COALESCE(ap.priority_level, 0) as promotion_priority,
             ap.plan_type as promotion_type,
             ap.end_date as promotion_end_date,
             ap.is_active as is_promoted
             ${distanceSelect}
      FROM advertisements a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories sc ON a.subcategory_id = sc.id
      LEFT JOIN user_locations ul ON a.location_id = ul.id
      LEFT JOIN ad_activities act ON a.activity_id = act.id
      LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
      LEFT JOIN ad_ages ag ON a.age_id = ag.id
      LEFT JOIN ad_genders gend ON a.gender_id = gend.id
      LEFT JOIN ad_sizes sz ON a.size_id = sz.id
      LEFT JOIN ad_colors col ON a.color_id = col.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN (
        SELECT ap1.advertisement_id, ap1.priority_level, ap1.plan_type, ap1.end_date, ap1.is_active
        FROM advertisement_promotions ap1
        INNER JOIN (
          SELECT advertisement_id, MAX(priority_level) as max_priority
          FROM advertisement_promotions
          WHERE is_active = TRUE AND status = 'active' AND end_date > NOW()
          GROUP BY advertisement_id
        ) ap2 ON ap1.advertisement_id = ap2.advertisement_id 
             AND ap1.priority_level = ap2.max_priority
        WHERE ap1.is_active = TRUE AND ap1.status = 'active' AND ap1.end_date > NOW()
      ) ap ON a.id = ap.advertisement_id
      ${whereClause}
    `;

    // Add HAVING clause for distance filter
    if (latitude && longitude && radius) {
      query += ` HAVING distance <= ${parseFloat(radius)}`;
    }

    // Order by promotion priority first, then by selected sort field
    if (sortField === 'distance' && latitude && longitude) {
      query += ` ORDER BY promotion_priority DESC, distance ASC, a.created_at DESC`;
    } else {
      query += ` ORDER BY promotion_priority DESC, a.${sortField} ${sortOrder}`;
    }
    query += ` LIMIT ? OFFSET ?`;

    params.push(parseInt(limit), offset);

    const [ads] = await promisePool.query(query, params);

    // Parse badges if they are strings
    // Fetch badges separately for collected ad IDs
    let processedAds = [...ads];
    if (ads.length > 0) {
      const adIds = ads.map(ad => ad.id);

      // Fetch badges for all ads in the list
      const badgesQuery = `SELECT advertisement_id, badge_type as type, badge_level as level 
                           FROM product_badges 
                           WHERE advertisement_id IN (?) AND is_active = TRUE`;
      const [badges] = await promisePool.query(badgesQuery, [adIds]);

      // Group badges by advertisement_id
      const badgesMap = {};
      badges.forEach(b => {
        if (!badgesMap[b.advertisement_id]) {
          badgesMap[b.advertisement_id] = [];
        }
        badgesMap[b.advertisement_id].push({ type: b.type, level: b.level });
      });

      // Assign badges to ads
      processedAds = ads.map(ad => ({
        ...ad,
        badges: badgesMap[ad.id] || []
      }));
    }

    if (processedAds.length > 0) {
      console.log('📦 First Ad Badges Debug:', processedAds[0].badges);
      console.log('📄 Raw Badges:', ads[0].badges);
    }

    // Get total count (without distance filter for simplicity)
    const countQuery = `SELECT COUNT(*) as total FROM advertisements a ${whereClause}`;
    const [countResult] = await promisePool.query(
      countQuery,
      params.slice(0, params.length - 2) // Remove limit and offset
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        advertisements: processedAds.map(ad => ({
          ...ad,
          images: ad.images ? JSON.parse(ad.images) : [],
          distance: ad.distance ? parseFloat(ad.distance).toFixed(2) : null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: totalPages
        },
        filters_applied: {
          search,
          category_id,
          subcategory_id,
          activity_id,
          condition_id,
          price_range: { min: min_price, max: max_price },
          location: latitude && longitude ? { latitude, longitude, radius } : null
        }
      }
    });
  } catch (error) {
    console.error('Browse advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error browsing advertisements',
      error: error.message
    });
  }
};

/**
 * Get featured advertisements
 * GET /api/v1/mobile-app/advertisements/featured
 */
const getFeaturedAdvertisements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
             ul.name as location_name, ul.city, ul.country,
             act.name as activity_name, cond.name as condition_name,
             u.full_name as seller_name, u.id as seller_id
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.status = 'published' AND a.featured = TRUE
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: {
        advertisements: ads.map(ad => ({
          ...ad,
          images: ad.images ? JSON.parse(ad.images) : []
        }))
      }
    });
  } catch (error) {
    console.error('Get featured advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured advertisements',
      error: error.message
    });
  }
};

/**
 * Get advertisement by ID (public view with authentication)
 * GET /api/v1/mobile-app/advertisements/view/:id
 */
const getAdvertisementPublicView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const [ads] = await promisePool.query(
      `SELECT a.*, c.name as category_name, sc.name as subcategory_name,
             ul.name as location_name, ul.street, ul.city, ul.region, ul.country, ul.zip_code,
             ul.latitude, ul.longitude,
             act.name as activity_name, cond.name as condition_name,
             ag.name as age_name, gend.name as gender_name,
             sz.name as size_name, col.name as color_name, col.hex_code,
             u.id as seller_id, u.full_name as seller_name, u.avatar as seller_avatar,
             u.created_at as seller_member_since, u.username,
             sp.name as seller_plan_name, sp.slug as seller_plan_slug, 
             sp.plan_type as seller_plan_type, sp.color_hex as seller_plan_color
       FROM advertisements a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN categories sc ON a.subcategory_id = sc.id
       LEFT JOIN user_locations ul ON a.location_id = ul.id
       LEFT JOIN ad_activities act ON a.activity_id = act.id
       LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
       LEFT JOIN ad_ages ag ON a.age_id = ag.id
       LEFT JOIN ad_genders gend ON a.gender_id = gend.id
       LEFT JOIN ad_sizes sz ON a.size_id = sz.id
       LEFT JOIN ad_colors col ON a.color_id = col.id
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE a.id = ? AND a.status = 'published'`,
      [id]
    );

    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const ad = ads[0];

    // Fetch badges separately
    const [badges] = await promisePool.query(
      `SELECT badge_type as type, badge_level as level 
       FROM product_badges 
       WHERE advertisement_id = ? AND is_active = 1`,
      [id]
    );

    // Increment view count
    await promisePool.query(
      'UPDATE advertisements SET views_count = views_count + 1 WHERE id = ?',
      [id]
    );

    // Check if user has favorited this ad (if authenticated)
    let isFavorited = false;
    if (userId) {
      const [favorites] = await promisePool.query(
        'SELECT id FROM favorites WHERE user_id = ? AND advertisement_id = ?',
        [userId, id]
      );
      isFavorited = favorites.length > 0;
    }

    // Get seller's rating
    const [sellerRating] = await promisePool.query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
       FROM reviews WHERE reviewed_user_id = ?`,
      [ad.seller_id]
    );

    res.json({
      success: true,
      data: {
        advertisement: {
          ...ad,
          images: ad.images ? JSON.parse(ad.images) : [],
          is_favorited: isFavorited,
          badges: badges || [],
          seller: {
            id: ad.seller_id,
            username: ad.username,
            name: ad.seller_name,
            avatar: ad.seller_avatar,
            member_since: ad.seller_member_since,
            average_rating: sellerRating[0].average_rating || 0,
            total_reviews: sellerRating[0].total_reviews || 0,
            membership: ad.seller_plan_slug ? {
              name: ad.seller_plan_name,
              slug: ad.seller_plan_slug,
              type: ad.seller_plan_type,
              color: ad.seller_plan_color
            } : null
          }
        }
      }
    });
  } catch (error) {
    console.error('Get advertisement public view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement',
      error: error.message
    });
  }
};

module.exports = {
  getFilters,
  getUserLocations,
  createAdvertisement,
  updateAdvertisement,
  getUserAdvertisements,
  getAdvertisement,
  deleteAdvertisement,
  browseAdvertisements,
  getFeaturedAdvertisements,
  getAdvertisementPublicView,
  getAdvertisementPlans
};