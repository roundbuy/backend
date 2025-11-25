const { promisePool } = require('../../config/database');

/**
 * Create a new user location
 * POST /api/v1/mobile-app/locations
 */
const createLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, street, street2, city, region, country, zip_code, latitude, longitude, is_default = false } = req.body;

    // Validate required fields
    if (!name || !city || !country) {
      return res.status(400).json({
        success: false,
        message: 'Name, city, and country are required'
      });
    }

    // Check if user already has 3 locations
    const [existingLocations] = await promisePool.query(
      'SELECT COUNT(*) as count FROM user_locations WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    if (existingLocations[0].count >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 locations allowed per user'
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await promisePool.query(
        'UPDATE user_locations SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    // Create location
    const [result] = await promisePool.query(
      `INSERT INTO user_locations
       (user_id, name, street, street2, city, region, country, zip_code, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, street, street2, city, region, country, zip_code, latitude, longitude, is_default]
    );

    const locationId = result.insertId;

    // Get created location
    const [locations] = await promisePool.query(
      'SELECT * FROM user_locations WHERE id = ?',
      [locationId]
    );

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: {
        location: locations[0]
      }
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating location',
      error: error.message
    });
  }
};

/**
 * Update a user location
 * PUT /api/v1/mobile-app/locations/:id
 */
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, street, street2, city, region, country, zip_code, latitude, longitude, is_default } = req.body;

    // Check if location exists and belongs to user
    const [existingLocations] = await promisePool.query(
      'SELECT id FROM user_locations WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [id, userId]
    );

    if (existingLocations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await promisePool.query(
        'UPDATE user_locations SET is_default = FALSE WHERE user_id = ? AND id != ?',
        [userId, id]
      );
    }

    // Update location
    await promisePool.query(
      `UPDATE user_locations SET
        name = COALESCE(?, name),
        street = ?,
        street2 = ?,
        city = COALESCE(?, city),
        region = ?,
        country = COALESCE(?, country),
        zip_code = ?,
        latitude = ?,
        longitude = ?,
        is_default = COALESCE(?, is_default),
        updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, street, street2, city, region, country, zip_code, latitude, longitude, is_default, id, userId]
    );

    // Get updated location
    const [locations] = await promisePool.query(
      'SELECT * FROM user_locations WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: locations[0]
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

/**
 * Delete a user location
 * DELETE /api/v1/mobile-app/locations/:id
 */
const deleteLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if location exists and belongs to user
    const [existingLocations] = await promisePool.query(
      'SELECT id FROM user_locations WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [id, userId]
    );

    if (existingLocations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Soft delete location
    await promisePool.query(
      'UPDATE user_locations SET is_active = FALSE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};

/**
 * Set default location
 * PATCH /api/v1/mobile-app/locations/:id/set-default
 */
const setDefaultLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if location exists and belongs to user
    const [existingLocations] = await promisePool.query(
      'SELECT id FROM user_locations WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [id, userId]
    );

    if (existingLocations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Unset all defaults for user
    await promisePool.query(
      'UPDATE user_locations SET is_default = FALSE WHERE user_id = ?',
      [userId]
    );

    // Set this location as default
    await promisePool.query(
      'UPDATE user_locations SET is_default = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Default location updated successfully'
    });
  } catch (error) {
    console.error('Set default location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default location',
      error: error.message
    });
  }
};

module.exports = {
  createLocation,
  updateLocation,
  deleteLocation,
  setDefaultLocation
};