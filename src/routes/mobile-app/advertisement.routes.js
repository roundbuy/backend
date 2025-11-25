const express = require('express');
const router = express.Router();
const mobileAdvertisementController = require('../../controllers/mobile-app/advertisement.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Advertisement routes

/**
 * @route GET /api/v1/mobile-app/advertisements/filters
 * @desc Get all filter options for advertisements
 * @access Public
 */
router.get('/filters', mobileAdvertisementController.getFilters);

/**
 * @route GET /api/v1/mobile-app/advertisements/locations
 * @desc Get user's saved locations
 * @access Private (requires authentication)
 */
router.get('/locations', authenticate, mobileAdvertisementController.getUserLocations);

/**
 * @route POST /api/v1/mobile-app/advertisements
 * @desc Create a new advertisement
 * @access Private (requires authentication)
 * @body {string} title - Advertisement title
 * @body {string} description - Advertisement description
 * @body {array} images - Array of image URLs
 * @body {number} category_id - Category ID
 * @body {number} subcategory_id - Subcategory ID (optional)
 * @body {number} location_id - User location ID (optional)
 * @body {number} price - Price
 * @body {number} display_duration_days - Display duration (optional, default 60)
 * @body {number} activity_id - Activity ID (optional)
 * @body {number} condition_id - Condition ID (optional)
 * @body {number} age_id - Age ID (optional)
 * @body {number} gender_id - Gender ID (optional)
 * @body {number} size_id - Size ID (optional)
 * @body {number} color_id - Color ID (optional)
 */
router.post('/', authenticate, mobileAdvertisementController.createAdvertisement);

/**
 * @route GET /api/v1/mobile-app/advertisements
 * @desc Get user's advertisements
 * @access Private (requires authentication)
 * @query {string} status - Filter by status (optional)
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Items per page (default 20)
 */
router.get('/', authenticate, mobileAdvertisementController.getUserAdvertisements);

/**
 * @route GET /api/v1/mobile-app/advertisements/:id
 * @desc Get single advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.get('/:id', authenticate, mobileAdvertisementController.getAdvertisement);

/**
 * @route PUT /api/v1/mobile-app/advertisements/:id
 * @desc Update an advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.put('/:id', authenticate, mobileAdvertisementController.updateAdvertisement);

/**
 * @route DELETE /api/v1/mobile-app/advertisements/:id
 * @desc Delete an advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.delete('/:id', authenticate, mobileAdvertisementController.deleteAdvertisement);

module.exports = router;