const { promisePool } = require('../../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get filter options for advertisements
 * GET /api/v1/mobile-app/advertisements/filters
 */
const getFilters = async (req, res) => {
  try {
    // Get categories and subcategories
    const [categories] = await promisePool.query(
      `SELECT c1.id, c1.name, c1.slug,
              JSON_ARRAYAGG(JSON_OBJECT('id', c2.id, 'name', c2.name, 'slug', c2.slug)) as subcategories
       FROM categories c1
       LEFT JOIN categories c2 ON c2.parent_id = c1.id AND c2.is_active = TRUE
       WHERE c1.parent_id IS NULL AND c1.is_active = TRUE
       GROUP BY c1.id, c1.name, c1.slug
       ORDER BY c1.sort_order`
    );

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

    // Get sizes
    const [sizes] = await promisePool.query(
      'SELECT id, name, slug FROM ad_sizes WHERE is_active = TRUE ORDER BY sort_order'
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
      color_id
    } = req.body;

    // Validate required fields
    if (!title || !description || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and price are required'
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

    // Create advertisement
    const [result] = await promisePool.query(
      `INSERT INTO advertisements
       (user_id, title, description, images, category_id, subcategory_id, location_id,
        price, display_duration_days, activity_id, condition_id, age_id, gender_id,
        size_id, color_id, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), ?)`,
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
        endDate
      ]
    );

    const adId = result.insertId;

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
      color_id
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

    // Only allow editing if status is draft or rejected
    if (!['draft', 'rejected'].includes(ad.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit advertisement with current status'
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

    // Update advertisement
    await promisePool.query(
      `UPDATE advertisements SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        images = COALESCE(?, images),
        category_id = COALESCE(?, category_id),
        subcategory_id = ?,
        location_id = ?,
        price = COALESCE(?, price),
        display_duration_days = COALESCE(?, display_duration_days),
        activity_id = ?,
        condition_id = ?,
        age_id = ?,
        gender_id = ?,
        size_id = ?,
        color_id = ?,
        end_date = ?,
        updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description,
        images ? JSON.stringify(images) : null,
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
        endDate,
        id,
        userId
      ]
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
        advertisements: ads,
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

    res.json({
      success: true,
      data: {
        advertisement: ads[0]
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
             u.full_name as seller_name, u.id as seller_id
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
      ${whereClause}
    `;

    // Add HAVING clause for distance filter
    if (latitude && longitude && radius) {
      query += ` HAVING distance <= ${parseFloat(radius)}`;
    }

    query += ` ORDER BY ${sortField === 'distance' && latitude && longitude ? 'distance' : 'a.' + sortField} ${sortOrder}
      LIMIT ? OFFSET ?`;

    params.push(parseInt(limit), offset);

    const [ads] = await promisePool.query(query, params);

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
        advertisements: ads.map(ad => ({
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
             u.created_at as seller_member_since
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

    // Increment view count
    await promisePool.query(
      'UPDATE advertisements SET views_count = views_count + 1 WHERE id = ?',
      [id]
    );

    // Check if user has favorited this ad (if authenticated)
    let isFavorited = false;
    if (userId) {
      const [favorites] = await promisePool.query(
        'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
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
          seller: {
            id: ad.seller_id,
            name: ad.seller_name,
            avatar: ad.seller_avatar,
            member_since: ad.seller_member_since,
            average_rating: sellerRating[0].average_rating || 0,
            total_reviews: sellerRating[0].total_reviews || 0
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
  getAdvertisementPublicView
};