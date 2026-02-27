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
      location_id, // Deprecated single location
      location_ids, // New array of locations
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

    // Determine locations to use
    let targetLocationIds = [];
    if (location_ids && Array.isArray(location_ids) && location_ids.length > 0) {
      targetLocationIds = location_ids;
    } else if (location_id) {
      targetLocationIds = [location_id];
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one location is required'
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

    // Validate locations
    const [locations] = await promisePool.query(
      'SELECT id FROM user_locations WHERE id IN (?) AND user_id = ? AND is_active = TRUE',
      [targetLocationIds, userId]
    );

    if (locations.length !== targetLocationIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid locations selected'
      });
    }

    // Process images - ensure they are stored in the correct directory
    let processedImages = [];
    if (images && Array.isArray(images)) {
      processedImages = images;
    }

    // Calculate display end date
    let endDate = null;
    if (display_duration_days && display_duration_days > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + display_duration_days);
    }

    // Create advertisement
    // Note: We skip storing singular location_id in advertisements table or store the first one as primary/fallback
    const primaryLocationId = targetLocationIds[0];

    const [result] = await promisePool.query(
      `INSERT INTO advertisements
       (user_id, title, description, images, category_id, subcategory_id, location_id,
        price, display_duration_days, activity_id, condition_id, age_id, gender_id,
        size_id, color_id, dim_length, dim_width, dim_height, dim_unit, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        description,
        JSON.stringify(processedImages),
        category_id,
        subcategory_id || null,
        primaryLocationId, // Store primary location for backward compat
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

    // Insert location mappings
    const locationValues = targetLocationIds.map(locId => [adId, locId]);
    await promisePool.query(
      'INSERT INTO advertisement_locations (advertisement_id, location_id) VALUES ?',
      [locationValues]
    );

    // Auto-assign membership badge based on user's subscription plan
    try {
      const [userSub] = await promisePool.query(
        `SELECT sp.slug, us.end_date
         FROM users u
         JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      );

      if (userSub.length > 0 && userSub[0].slug) {
        const BadgeService = require('../../services/BadgeService');
        const subscriptionSlug = userSub[0].slug.toLowerCase();
        const expiryDate = userSub[0].end_date || null;

        // Only assign badge if it's a known membership tier
        if (['gold', 'orange', 'green'].includes(subscriptionSlug)) {
          await BadgeService.upsertBadge(
            adId,
            'membership',
            subscriptionSlug,
            expiryDate,
            null // Auto-calculate priority
          );
          console.log(`✅ Auto-assigned ${subscriptionSlug} membership badge to new ad ${adId}`);
        }
      }
    } catch (badgeError) {
      console.error('⚠️ Failed to auto-assign membership badge:', badgeError.message);
      // Continue even if badge assignment fails
    }

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

    // Fetch associated locations
    const [adLocations] = await promisePool.query(
      `SELECT ul.* 
       FROM advertisement_locations al
       JOIN user_locations ul ON al.location_id = ul.id
       WHERE al.advertisement_id = ?`,
      [adId]
    );

    const fullAd = {
      ...ads[0],
      locations: adLocations,
      images: processedImages
    };

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: {
        advertisement: fullAd
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
      location_ids,
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
    const allowedStatuses = ['draft', 'rejected', 'published'];
    if (!allowedStatuses.includes(ad.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify advertisement with current status'
      });
    }

    // Determine target location IDs if provided
    let targetLocationIds = null;
    if (location_ids && Array.isArray(location_ids) && location_ids.length > 0) {
      targetLocationIds = location_ids;
    } else if (location_id) {
      targetLocationIds = [location_id];
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

    // Validate locations if provided
    if (targetLocationIds) {
      const [locations] = await promisePool.query(
        'SELECT id FROM user_locations WHERE id IN (?) AND user_id = ? AND is_active = TRUE',
        [targetLocationIds, userId]
      );

      if (locations.length !== targetLocationIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid locations selected'
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

    // Update primary location_id for backward compat if locations changed
    if (targetLocationIds) {
      updates.push('location_id = ?');
      params.push(targetLocationIds[0]);
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

    if (updates.length > 0) {
      // Update advertisement
      params.push(id, userId);
      await promisePool.query(
        `UPDATE advertisements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        params
      );
    }

    // Update location mappings if changed
    if (targetLocationIds) {
      // Delete existing mappings
      await promisePool.query('DELETE FROM advertisement_locations WHERE advertisement_id = ?', [id]);

      // Insert new mappings
      const locationValues = targetLocationIds.map(locId => [id, locId]);
      await promisePool.query(
        'INSERT INTO advertisement_locations (advertisement_id, location_id) VALUES ?',
        [locationValues]
      );
    }

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

    // Fetch associated locations
    const [adLocations] = await promisePool.query(
      `SELECT ul.* 
       FROM advertisement_locations al
       JOIN user_locations ul ON al.location_id = ul.id
       WHERE al.advertisement_id = ?`,
      [id]
    );

    const fullAd = {
      ...ads[0],
      locations: adLocations,
      images: ads[0].images ? JSON.parse(ads[0].images) : []
    };

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: {
        advertisement: fullAd
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

    // Fetch badges and locations for these advertisements
    let processedAds = [];
    if (ads.length > 0) {
      const adIds = ads.map(ad => ad.id);

      // Fetch badges for all ads in the list
      const badgesQuery = `SELECT advertisement_id, badge_type as type, badge_level as level 
                           FROM product_badges 
                           WHERE advertisement_id IN (?) AND is_active = 1`;
      const [badges] = await promisePool.query(badgesQuery, [adIds]);

      // Fetch locations for all ads
      const locationsQuery = `SELECT al.advertisement_id, ul.id, ul.name, ul.city, ul.country 
                              FROM advertisement_locations al
                              JOIN user_locations ul ON al.location_id = ul.id
                              WHERE al.advertisement_id IN (?)`;
      const [locations] = await promisePool.query(locationsQuery, [adIds]);

      // Group badges by advertisement_id
      const badgesMap = {};
      badges.forEach(b => {
        if (!badgesMap[b.advertisement_id]) {
          badgesMap[b.advertisement_id] = [];
        }
        badgesMap[b.advertisement_id].push({ type: b.type, level: b.level });
      });

      // Group locations by advertisement_id
      const locationsMap = {};
      locations.forEach(l => {
        if (!locationsMap[l.advertisement_id]) {
          locationsMap[l.advertisement_id] = [];
        }
        locationsMap[l.advertisement_id].push(l);
      });

      // Assign badges and locations to ads
      processedAds = ads.map(ad => ({
        ...ad,
        badges: badgesMap[ad.id] || [],
        locations: locationsMap[ad.id] || [],
        images: ad.images ? JSON.parse(ad.images) : []
      }));
    } else {
      processedAds = [];
    }

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

    // Fetch locations separately
    const [locations] = await promisePool.query(
      `SELECT ul.* 
       FROM advertisement_locations al
       JOIN user_locations ul ON al.location_id = ul.id
       WHERE al.advertisement_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        advertisement: {
          ...ads[0],
          badges: badges || [],
          locations: locations || [],
          images: ads[0].images ? JSON.parse(ads[0].images) : []
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
      limit = 100
    } = req.query;

    // Base WHERE clause
    let whereClause = `WHERE a.status = "published"`;
    let params = [];

    // Exclude ads that are ONLY in showcases (to prevent duplicates) from the main list
    whereClause += ` AND a.id NOT IN (
        SELECT DISTINCT advertisement_id 
        FROM product_badges 
        WHERE badge_type = 'visibility' 
        AND badge_level = 'show_casing' 
        AND showcase_group_id IS NOT NULL
        AND is_active = TRUE
      )`;

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
    // We now join with advertisement_locations -> user_locations
    let locationJoin = '';
    let distanceSelect = '';

    if (latitude && longitude) {
      // OPTIMIZATION: We select the minimum distance for each ad
      distanceSelect = `, MIN(
        (6371 * acos(cos(radians(?)) * cos(radians(ul.latitude)) *
        cos(radians(ul.longitude) - radians(?)) + sin(radians(?)) *
        sin(radians(ul.latitude))))
      ) AS distance`;

      // Add params for distance calculation (lat, long, lat)
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(latitude));

      locationJoin = `
        LEFT JOIN advertisement_locations al ON a.id = al.advertisement_id
        LEFT JOIN user_locations ul ON al.location_id = ul.id
      `;
    } else {
      locationJoin = `
        LEFT JOIN advertisement_locations al ON a.id = al.advertisement_id
        LEFT JOIN user_locations ul ON al.location_id = ul.id
      `;
    }

    // Valid sort fields
    const validSorts = ['created_at', 'price', 'views_count', 'distance'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Build query
    // We group by a.id to ensure unique advertisements
    // We select MAX/MIN/ANY for joined fields where multiple could exist
    let query = `
      SELECT a.*, c.name as category_name, sc.name as subcategory_name,
             MAX(ul.name) as location_name, 
             MAX(ul.city) as city, 
             MAX(ul.country) as country,
             act.name as activity_name, cond.name as condition_name,
             ag.name as age_name, gend.name as gender_name,
             sz.name as size_name, col.name as color_name, col.hex_code,
             u.full_name as seller_name, u.id as seller_id,
             COALESCE(MAX(pb.max_priority), 0) as badge_priority
             ${distanceSelect}
      FROM advertisements a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories sc ON a.subcategory_id = sc.id
      ${locationJoin}
      LEFT JOIN ad_activities act ON a.activity_id = act.id
      LEFT JOIN ad_conditions cond ON a.condition_id = cond.id
      LEFT JOIN ad_ages ag ON a.age_id = ag.id
      LEFT JOIN ad_genders gend ON a.gender_id = gend.id
      LEFT JOIN ad_sizes sz ON a.size_id = sz.id
      LEFT JOIN ad_colors col ON a.color_id = col.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN (
        SELECT advertisement_id, MAX(priority_level) as max_priority
        FROM product_badges
        WHERE is_active = TRUE 
          AND (expiry_date IS NULL OR expiry_date > NOW())
        GROUP BY advertisement_id
      ) pb ON a.id = pb.advertisement_id
      ${whereClause}
      GROUP BY a.id
    `;

    // Add HAVING clause for distance filter
    if (latitude && longitude && radius) {
      query += ` HAVING distance <= ${parseFloat(radius)}`;
    }

    // Order by badge priority first, then by selected sort field
    if (sortField === 'distance' && latitude && longitude) {
      query += ` ORDER BY badge_priority DESC, distance ASC, a.created_at DESC`;
    } else {
      query += ` ORDER BY badge_priority DESC, a.${sortField} ${sortOrder}`;
    }
    query += ` LIMIT ? OFFSET ?`;

    params.push(parseInt(limit), offset);

    const [ads] = await promisePool.query(query, params);

    console.log(`\n📦 Browse query fetched ${ads.length} ads (excluding showcase-only products)`);
    if (ads.length > 0) {
      console.log('   Sample ads:');
      ads.slice(0, 3).forEach((ad, idx) => {
        console.log(`   ${idx + 1}. ${ad.title} (ID: ${ad.id})`);
      });
    }

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

      // Fetch locations for all ads to be complete
      const locationsQuery = `SELECT al.advertisement_id, ul.id, ul.name, ul.city, ul.country, ul.latitude, ul.longitude 
                              FROM advertisement_locations al
                              JOIN user_locations ul ON al.location_id = ul.id
                              WHERE al.advertisement_id IN (?)`;
      const [locations] = await promisePool.query(locationsQuery, [adIds]);

      // Group badges by advertisement_id
      const badgesMap = {};
      badges.forEach(b => {
        if (!badgesMap[b.advertisement_id]) {
          badgesMap[b.advertisement_id] = [];
        }
        badgesMap[b.advertisement_id].push({ type: b.type, level: b.level });
      });

      // Group locations by advertisement_id
      const locationsMap = {};
      locations.forEach(l => {
        if (!locationsMap[l.advertisement_id]) {
          locationsMap[l.advertisement_id] = [];
        }
        locationsMap[l.advertisement_id].push(l);
      });

      // Assign badges and locations to ads, and determine display lat/long
      processedAds = ads.map(ad => {
        const adLocations = locationsMap[ad.id] || [];
        let displayLocation = adLocations[0]; // Default to first location

        // If search coordinates provided, find closest location
        if (latitude && longitude && adLocations.length > 0) {
          let minDistance = Infinity;
          const searchLat = parseFloat(latitude);
          const searchLng = parseFloat(longitude);

          adLocations.forEach(loc => {
            const locLat = parseFloat(loc.latitude);
            const locLng = parseFloat(loc.longitude);
            // Simple Euclidean distance for comparison (sufficient for sorting closest)
            const dist = Math.sqrt(Math.pow(locLat - searchLat, 2) + Math.pow(locLng - searchLng, 2));
            if (dist < minDistance) {
              minDistance = dist;
              displayLocation = loc;
            }
          });
        }

        return {
          ...ad,
          badges: badgesMap[ad.id] || [],
          locations: adLocations,
          images: ad.images ? JSON.parse(ad.images) : [],
          // Set top-level lat/long for map markers
          latitude: displayLocation ? displayLocation.latitude : null,
          longitude: displayLocation ? displayLocation.longitude : null
        };
      });
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total 
      FROM advertisements a
      ${locationJoin}
      ${whereClause}
    `;

    let countParams = params.slice(0, params.length - 2); // all params except limit/offset

    // If we have HAVING clause in main query, we can't easily put it in count without subquery
    if (latitude && longitude && radius) {
      countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT a.id,
          MIN((6371 * acos(cos(radians(?)) * cos(radians(ul.latitude)) *
          cos(radians(ul.longitude) - radians(?)) + sin(radians(?)) *
          sin(radians(ul.latitude))))) AS distance
          FROM advertisements a
          ${locationJoin}
          ${whereClause}
          GROUP BY a.id
          HAVING distance <= ?
        ) as filtered_ads
       `;

      countParams = [parseFloat(latitude), parseFloat(longitude), parseFloat(latitude), ...params.slice(3, params.length - 2), parseFloat(radius)];
    }

    const [countResult] = await promisePool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    let assembledAds = processedAds;

    // Only assemble feed (inject banners, showcases, homemarkets) if not filtering by a specific user
    if (!user_id) {
      const showcases = await fetchActiveShowcases({ latitude, longitude, radius });
      const homemarkets = await fetchActiveHomeMarkets({ latitude, longitude, radius });
      const banners = await fetchActiveBannerAds();
      assembledAds = await assembleProductListing(processedAds, showcases, homemarkets, banners);
    }

    res.json({
      success: true,
      data: {
        advertisements: assembledAds.map(item => {
          if (['showcase', 'homemarket_group', 'homemarket', 'banner', 'section_header'].includes(item.type)) {
            return item;
          }
          // Process regular ad
          return {
            ...item,
            // Images already parsed above
            distance: item.distance ? parseFloat(item.distance).toFixed(2) : null
          };
        }),
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
          user_id,
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
 * Helper function to fetch active showcases
 */
async function fetchActiveShowcases(filters = {}) {
  try {
    const { latitude, longitude, radius } = filters;

    // Build location filter for showcases
    let locationWhere = '';
    const params = [];

    if (latitude && longitude && radius) {
      // Check if ANY location of the ad is within radius
      locationWhere = `
        AND (
          SELECT MIN(6371 * acos(cos(radians(?)) * cos(radians(ul_sub.latitude)) *
          cos(radians(ul_sub.longitude) - radians(?)) + sin(radians(?)) *
          sin(radians(ul_sub.latitude))))
          FROM advertisement_locations al_sub
          JOIN user_locations ul_sub ON al_sub.location_id = ul_sub.id
          WHERE al_sub.advertisement_id = a.id
        ) <= ?
      `;
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(latitude), parseFloat(radius));
    }

    // Get all active showcase groups
    const showcaseQuery = `
      SELECT 
        pb.showcase_group_id,
        MIN(a.user_id) as user_id,
        MIN(u.full_name) as seller_name,
        MIN(pb.expiry_date) as expires_at,
        COUNT(DISTINCT pb.advertisement_id) as product_count
      FROM product_badges pb
      JOIN advertisements a ON pb.advertisement_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pb.badge_type = 'visibility'
        AND pb.badge_level = 'show_casing'
        AND pb.is_active = TRUE
        AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
        AND pb.showcase_group_id IS NOT NULL
        AND a.status = 'published'
        ${locationWhere}
      GROUP BY pb.showcase_group_id
      HAVING product_count >= 4
      ORDER BY MIN(pb.created_at) DESC
      LIMIT 5
    `;

    const [showcaseGroups] = await promisePool.query(showcaseQuery, params);

    console.log(`🔍 Showcase query found ${showcaseGroups.length} groups`);
    if (showcaseGroups.length === 0) {
      return [];
    }

    // Fetch products for each showcase
    const showcases = [];
    for (const group of showcaseGroups) {
      const productsQuery = `
        SELECT 
          a.id, a.title, a.price, a.images, a.user_id,
          a.created_at, a.views_count,
          pb.showcase_group_id
        FROM product_badges pb
        JOIN advertisements a ON pb.advertisement_id = a.id
        WHERE pb.showcase_group_id = ?
          AND pb.is_active = TRUE
          AND a.status = 'published'
        ORDER BY pb.created_at
        LIMIT 10
      `;

      const [products] = await promisePool.query(productsQuery, [group.showcase_group_id]);

      if (products.length >= 4) {
        showcases.push({
          type: 'showcase',
          showcase_group_id: group.showcase_group_id,
          user_id: group.user_id,
          seller_name: group.seller_name,
          expires_at: group.expires_at,
          product_count: products.length,
          products: products.map(p => ({
            ...p,
            images: p.images ? JSON.parse(p.images) : []
          }))
        });
      }
    }

    return showcases;
  } catch (error) {
    console.error('Error fetching showcases:', error);
    return [];
  }
}

/**
 * Helper function to inject showcases into ad results
 * Injects after every 2 rows (4 ads, assuming 2 columns)
 */
async function injectShowcases(ads, filters = {}) {
  try {
    const INJECT_INTERVAL = 4; // After every 2 rows (2 ads per row)
    const showcases = await fetchActiveShowcases(filters);

    if (showcases.length === 0) {
      return ads;
    }

    const result = [];
    let showcaseIndex = 0;

    for (let i = 0; i < ads.length; i++) {
      result.push(ads[i]);

      // Inject showcase after every 4 ads
      if ((i + 1) % INJECT_INTERVAL === 0 && showcaseIndex < showcases.length) {
        result.push(showcases[showcaseIndex]);
        showcaseIndex++;
      }
    }

    console.log(`📦 Injected ${showcaseIndex} showcase(s) into ${ads.length} ads`);

    return result;
  } catch (error) {
    console.error('Error injecting showcases:', error);
    return ads; // Return original ads if injection fails
  }
}

/**
 * Helper function to fetch active HomeMarkets
 * Returns HomeMarket carousel items with priority ranking (Gold > Orange > Green)
 */
async function fetchActiveHomeMarkets(filters = {}) {
  try {
    const { latitude, longitude, radius } = filters;

    // Build location filter for homemarkets
    let locationWhere = '';
    const params = [];

    if (latitude && longitude && radius) {
      locationWhere = `
        AND (
          SELECT MIN(6371 * acos(cos(radians(?)) * cos(radians(ul_sub.latitude)) *
          cos(radians(ul_sub.longitude) - radians(?)) + sin(radians(?)) *
          sin(radians(ul_sub.latitude))))
          FROM advertisement_locations al_sub
          JOIN user_locations ul_sub ON al_sub.location_id = ul_sub.id
          WHERE al_sub.advertisement_id = a.id
        ) <= ?
      `;
      params.push(parseFloat(latitude), parseFloat(longitude), parseFloat(latitude), parseFloat(radius));
    }

    // Get active HomeMarket products grouped by user
    // Priority: Gold (80) > Orange (75) > Green (70)
    const homemarketQuery = `
      SELECT 
        a.user_id,
        u.full_name as seller_name,
        pb.badge_level as tier,
        pb.priority_level,
        pb.expiry_date as expires_at,
        a.id as advertisement_id,
        a.title,
        a.price,
        a.images
      FROM product_badges pb
      JOIN advertisements a ON pb.advertisement_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE pb.badge_type = 'visibility'
        AND pb.badge_level IN ('homemarket-gold-7-days', 'homemarket-orange-7-days', 'homemarket-green-7-days')
        AND pb.is_active = TRUE
        AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
        AND a.status = 'published'
        ${locationWhere}
      ORDER BY pb.priority_level DESC, a.created_at DESC
    `;

    const [homemarkets] = await promisePool.query(homemarketQuery, params);

    if (homemarkets.length === 0) {
      return [];
    }

    // Group by user_id
    const userGroups = {};

    homemarkets.forEach(hm => {
      if (!userGroups[hm.user_id]) {
        userGroups[hm.user_id] = {
          type: 'homemarket',
          tier: hm.tier.includes('gold') ? 'gold' : hm.tier.includes('orange') ? 'orange' : 'green',
          seller_name: hm.seller_name,
          seller_id: hm.user_id,
          priority_level: hm.priority_level,
          products: []
        };
      }
      userGroups[hm.user_id].products.push({
        id: hm.advertisement_id,
        title: hm.title,
        price: hm.price,
        seller_name: hm.seller_name,
        images: hm.images ? JSON.parse(hm.images) : []
      });
    });

    // Convert to array and sort by priority
    const result = Object.values(userGroups).sort((a, b) => b.priority_level - a.priority_level);

    console.log(`🏠 Found ${result.length} active HomeMarket user(s) with ${homemarkets.length} total products`);
    return result;

  } catch (error) {
    console.error('Error fetching HomeMarkets:', error);
    return [];
  }
}
/**
 * Helper function to fetch active banner ads
 */
async function fetchActiveBannerAds() {
  try {
    const bannerQuery = `
      SELECT 
        id,
        title,
        image_url,
        link_url,
        size,
        placement
      FROM banners
      WHERE status = 'published'
        AND placement = 'search_listing'
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date > NOW())
      ORDER BY RAND()
      LIMIT 10
    `;

    const [banners] = await promisePool.query(bannerQuery);

    const result = banners.map(banner => ({
      type: 'banner',
      id: banner.id,
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url,
      size: banner.size
    }));

    console.log(`📢 Found ${result.length} active banner ad(s)`);
    return result;

  } catch (error) {
    console.error('Error fetching banner ads:', error);
    return [];
  }
}

/**
 * Helper function to assemble product listing with correct order
 * Order: Promotions -> Standard Listings with injections (ShowCasing, HomeMarket, Banners)
 */
async function assembleProductListing(ads, showcases, homemarkets, banners) {
  try {
    console.log('\n🔍 DEBUG: Starting assembleProductListing');
    console.log(`📊 Input: ${ads.length} ads, ${showcases.length} showcases, ${homemarkets.length} homemarkets, ${banners.length} banners`);

    // Log first few ads with their badges
    console.log('\n🏷️  Sample ads with badges:');
    ads.slice(0, 5).forEach((ad, idx) => {
      console.log(`  Ad ${idx + 1} (ID: ${ad.id}): ${ad.title}`);
      if (ad.badges && ad.badges.length > 0) {
        ad.badges.forEach(badge => {
          console.log(`    - Badge: type="${badge.type}", level="${badge.level}"`);
        });
      } else {
        console.log(`    - No badges`);
      }
    });

    // 1. Separate promotions from standard listings
    // Promotions: ads with visibility badges (rise_to_top, top_spot, fast, targeted)
    // Standard: ads WITHOUT promotion visibility badges (can have show_casing or homemarket badges)
    const promotionBadgeLevels = ['rise_to_top', 'top_spot', 'fast', 'targeted'];

    const promotions = ads.filter(ad =>
      ad.badges && ad.badges.some(b =>
        b.type === 'visibility' &&
        promotionBadgeLevels.includes(b.level)
      )
    );

    const standard = ads.filter(ad =>
      !ad.badges || !ad.badges.some(b =>
        b.type === 'visibility' && promotionBadgeLevels.includes(b.level)
      )
    );

    console.log(`\n📊 Separated: ${promotions.length} promotions, ${standard.length} standard`);

    if (promotions.length > 0) {
      console.log('🎯 Promotion ads:');
      promotions.forEach((ad, idx) => {
        const visibilityBadge = ad.badges.find(b => b.type === 'visibility');
        console.log(`  ${idx + 1}. ${ad.title} (badge: ${visibilityBadge?.level})`);
      });
    } else {
      console.log('⚠️  No promotions found!');
    }

    // 2. Build result array
    const result = [];

    // Step 1: Add promotions section at the very top
    if (promotions.length > 0) {
      console.log(`\n✅ Adding PROMOTIONS section with ${promotions.length} ads`);
      result.push({ type: 'section_header', title: 'PROMOTIONS' });
      result.push({ type: 'horizontal_line' });
      result.push({
        type: 'promotions',
        products: promotions
      });
      result.push({ type: 'horizontal_line' });
    }

    // Step 2: Add first showcase immediately after promotions
    let showcaseIndex = 0;
    let homemarketsInjected = false;
    let bannerIndex = 0;

    if (showcases.length > 0) {
      console.log(`\n✅ Adding first SHOWCASING ROOM (${showcases[0].products?.length || 0} products)`);
      result.push({ type: 'section_header', title: 'SHOWCASING' });
      result.push({ type: 'horizontal_line' });
      result.push(showcases[showcaseIndex++]);
      result.push({ type: 'horizontal_line' });

      // Inject banner after first showcase if available
      if (bannerIndex < banners.length) {
        console.log(`  📌 Injecting BANNER after Showcase (size: ${banners[bannerIndex].size})`);
        result.push(banners[bannerIndex++]);
      }
    }

    console.log(`\n📋 Starting standard listings injection (${standard.length} standard ads)...`);

    // Step 3: Inject standard listings with pattern:
    // Batch standard products into groups of 6 (3 rows × 2 columns)
    // Pattern: Standard batch → ShowCasing (+Banner) → Standard batch → HomeMarket (+Banner) → Repeat
    let standardIndex = 0;
    let batchCount = 0;
    let patternStep = 0; // 0: wait for showcase, 1: wait for homemarket
    const PRODUCTS_PER_BATCH = 6; // 3 rows × 2 columns

    while (standardIndex < standard.length) {
      // Create a batch of standard products
      const batchSize = Math.min(PRODUCTS_PER_BATCH, standard.length - standardIndex);
      const batch = standard.slice(standardIndex, standardIndex + batchSize);
      standardIndex += batchSize;

      console.log(`  ✅ Adding STANDARD batch ${batchCount + 1} with ${batchSize} products`);
      result.push({
        type: 'standard',
        products: batch
      });
      batchCount++;

      // Check if we should inject content
      if (batchCount >= 1) {
        let injectedContent = false;

        // Determine what to inject (Showcase vs HomeMarket vs Banner)
        const canInjectShowcase = showcaseIndex < showcases.length;
        const canInjectHomeMarket = homemarkets.length > 0 && !homemarketsInjected;

        // Strategy: Alternate between Showcase and HomeMarket if available
        let injectType = null;

        if (patternStep === 0) {
          // Prefer Showcase
          if (canInjectShowcase) injectType = 'showcase';
          else if (canInjectHomeMarket) injectType = 'homemarket_group';
        } else {
          // Prefer HomeMarket
          if (canInjectHomeMarket) injectType = 'homemarket_group';
          else if (canInjectShowcase) injectType = 'showcase';
        }

        // If neither found, checking for pure banner injection will happen in the 'else' block below

        if (injectType === 'showcase') {
          console.log(`  📌 Injecting SHOWCASING after batch ${batchCount} (${showcases[showcaseIndex].products?.length || 0} products)`);
          result.push({ type: 'section_header', title: 'SHOWCASING' });
          result.push({ type: 'horizontal_line' });
          result.push(showcases[showcaseIndex++]);
          result.push({ type: 'horizontal_line' });

          // Try to inject banner along with showcase
          if (bannerIndex < banners.length) {
            console.log(`  📌 Injecting BANNER after Showcase`);
            result.push(banners[bannerIndex++]);
            result.push({ type: 'horizontal_line' });
          }

          injectedContent = true;
          patternStep = 1; // Switch preference
        } else if (injectType === 'homemarket_group') {
          console.log(`  📌 Injecting HOMEMARKET GROUP after batch ${batchCount} (${homemarkets.length} users)`);
          result.push({ type: 'section_header', title: 'HOMEMARKET' });
          result.push({ type: 'horizontal_line' });
          result.push({ type: 'homemarket_group', users: homemarkets });
          result.push({ type: 'horizontal_line' });

          // Try to inject banner along with homemarket
          if (bannerIndex < banners.length) {
            console.log(`  📌 Injecting BANNER after HomeMarket`);
            result.push(banners[bannerIndex++]);
            result.push({ type: 'horizontal_line' });
          }

          injectedContent = true;
          homemarketsInjected = true;
          patternStep = 0; // Switch preference
        } else {
          // No Showcases or HomeMarkets left (or none available)
          // Just inject a banner if available
          if (bannerIndex < banners.length) {
            console.log(`  📌 Injecting BANNER independently after batch ${batchCount}`);
            result.push(banners[bannerIndex++]);
            result.push({ type: 'horizontal_line' });
            injectedContent = true;
          }
        }

        if (injectedContent) {
          batchCount = 0; // Reset batch count only if we injected something
        }
      }
    }

    console.log(`\n✅ Assembled ${result.length} total items:`);
    console.log(`   - ${promotions.length} promotions`);
    console.log(`   - ${standard.length} standard ads`);
    console.log(`   - ${showcaseIndex} showcases`);
    console.log(`   - ${homemarkets.length} homemarket users in 1 group`);
    console.log(`   - ${bannerIndex} banners`);
    console.log(`   - ${result.filter(r => r.type === 'horizontal_line').length} horizontal lines`);
    console.log(`   - ${result.filter(r => r.type === 'section_header').length} section headers\n`);
    return result;

  } catch (error) {
    console.error('Error assembling product listing:', error);
    return ads; // Return original ads if assembly fails
  }
}

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

/**
 * Sync advertisement badges for user's published ads
 * POST /api/v1/mobile-app/advertisements/sync-badges
 * This endpoint ensures all user's published ads have the correct membership badge
 */
const syncAdvertisementBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current subscription
    const [userSub] = await promisePool.query(
      `SELECT sp.slug, us.end_date
       FROM users u
       JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (userSub.length === 0 || !userSub[0].slug) {
      return res.json({
        success: true,
        message: 'No active subscription found',
        data: {
          synced_count: 0
        }
      });
    }

    const subscriptionSlug = userSub[0].slug.toLowerCase();
    const expiryDate = userSub[0].end_date || null;

    // Only sync for known membership tiers
    if (!['gold', 'orange', 'green'].includes(subscriptionSlug)) {
      return res.json({
        success: true,
        message: 'Subscription plan does not require badge sync',
        data: {
          synced_count: 0
        }
      });
    }

    // Get all user's published advertisements
    const [userAds] = await promisePool.query(
      'SELECT id FROM advertisements WHERE user_id = ? AND status = "published"',
      [userId]
    );

    if (userAds.length === 0) {
      return res.json({
        success: true,
        message: 'No published advertisements found',
        data: {
          synced_count: 0
        }
      });
    }

    // Sync badges for all ads
    const BadgeService = require('../../services/BadgeService');
    let syncedCount = 0;

    for (const ad of userAds) {
      try {
        await BadgeService.upsertBadge(
          ad.id,
          'membership',
          subscriptionSlug,
          expiryDate,
          null // Auto-calculate priority
        );
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync badge for ad ${ad.id}:`, error.message);
      }
    }

    console.log(`✅ Synced ${syncedCount}/${userAds.length} advertisement badges for user ${userId}`);

    res.json({
      success: true,
      message: `Successfully synced badges for ${syncedCount} advertisements`,
      data: {
        synced_count: syncedCount,
        total_ads: userAds.length,
        subscription_tier: subscriptionSlug
      }
    });
  } catch (error) {
    console.error('Sync advertisement badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing advertisement badges',
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
  getAdvertisementPlans,
  syncAdvertisementBadges
};