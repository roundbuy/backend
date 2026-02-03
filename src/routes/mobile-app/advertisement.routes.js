const express = require('express');
const router = express.Router();
const mobileAdvertisementController = require('../../controllers/mobile-app/advertisement.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { checkSubscription, checkFeatureLimit } = require('../../middleware/subscription.middleware');

// Advertisement routes

/**
 * @route GET /api/v1/mobile-app/advertisements/filters
 * @desc Get all filter options for advertisements
 * @access Public
 */
router.get('/filters', mobileAdvertisementController.getFilters);

/**
 * @route GET /api/v1/mobile-app/advertisements/browse
 * @desc Browse/search all published advertisements with filters
 * @access Private (requires authentication and subscription)
 * @query {string} search - Search term (optional)
 * @query {number} category_id - Category ID (optional)
 * @query {number} subcategory_id - Subcategory ID (optional)
 * @query {number} activity_id - Activity ID (optional)
 * @query {number} condition_id - Condition ID (optional)
 * @query {number} min_price - Minimum price (optional)
 * @query {number} max_price - Maximum price (optional)
 * @query {number} latitude - User latitude for distance-based search (optional)
 * @query {number} longitude - User longitude for distance-based search (optional)
 * @query {number} radius - Search radius in km (default 50)
 * @query {string} sort - Sort field: created_at, price, views_count, distance (default created_at)
 * @query {string} order - Sort order: ASC, DESC (default DESC)
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Items per page (default 20)
 */
router.get('/browse', authenticate, checkSubscription, mobileAdvertisementController.browseAdvertisements);

/**
 * @route GET /api/v1/mobile-app/advertisements/featured
 * @desc Get featured/promoted advertisements
 * @access Private (requires authentication and subscription)
 * @query {number} limit - Number of items (default 10)
 */
router.get('/featured', authenticate, checkSubscription, mobileAdvertisementController.getFeaturedAdvertisements);

/**
 * @route GET /api/v1/mobile-app/advertisements/view/:id
 * @desc Get advertisement details for public viewing (increments view count)
 * @access Private (requires authentication and subscription)
 * @param {number} id - Advertisement ID
 */
router.get('/view/:id', authenticate, checkSubscription, mobileAdvertisementController.getAdvertisementPublicView);

/**
 * @route GET /api/v1/mobile-app/advertisements/locations
 * @desc Get user's saved locations
 * @access Private (requires authentication)
 */
router.get('/locations', authenticate, mobileAdvertisementController.getUserLocations);

/**
 * @route GET /api/v1/mobile-app/advertisements/plans
 * @desc Get all advertisement plans
 * @access Private (requires authentication)
 */
router.get('/plans', authenticate, mobileAdvertisementController.getAdvertisementPlans);

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
router.post('/', authenticate, checkSubscription, checkFeatureLimit('max_ads'), mobileAdvertisementController.createAdvertisement);

/**
 * @route GET /api/v1/mobile-app/advertisements
 * @desc Get user's advertisements
 * @access Private (requires authentication)
 * @query {string} status - Filter by status (optional)
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Items per page (default 20)
 */
router.get('/', authenticate, checkSubscription, mobileAdvertisementController.getUserAdvertisements);

/**
 * @route GET /api/v1/mobile-app/advertisements/:id
 * @desc Get single advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.get('/:id', authenticate, checkSubscription, mobileAdvertisementController.getAdvertisement);

/**
 * @route PUT /api/v1/mobile-app/advertisements/:id
 * @desc Update an advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.put('/:id', authenticate, checkSubscription, mobileAdvertisementController.updateAdvertisement);

/**
 * @route DELETE /api/v1/mobile-app/advertisements/:id
 * @desc Delete an advertisement
 * @access Private (requires authentication)
 * @param {number} id - Advertisement ID
 */
router.delete('/:id', authenticate, checkSubscription, mobileAdvertisementController.deleteAdvertisement);

module.exports = router;