const express = require('express');
const router = express.Router();
const mobileLocationController = require('../../controllers/mobile-app/location.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route POST /api/v1/mobile-app/locations
 * @desc Create a new user location
 * @access Private (requires authentication)
 * @body {string} name - Location name
 * @body {string} street - Street address
 * @body {string} street2 - Street address line 2
 * @body {string} city - City
 * @body {string} region - State/Province
 * @body {string} country - Country
 * @body {string} zip_code - ZIP/Postal code
 * @body {decimal} latitude - Latitude coordinate
 * @body {decimal} longitude - Longitude coordinate
 * @body {boolean} is_default - Set as default location
 */
router.post('/', authenticate, mobileLocationController.createLocation);

/**
 * @route PUT /api/v1/mobile-app/locations/:id
 * @desc Update a user location
 * @access Private (requires authentication)
 * @param {number} id - Location ID
 */
router.put('/:id', authenticate, mobileLocationController.updateLocation);

/**
 * @route DELETE /api/v1/mobile-app/locations/:id
 * @desc Delete a user location
 * @access Private (requires authentication)
 * @param {number} id - Location ID
 */
router.delete('/:id', authenticate, mobileLocationController.deleteLocation);

/**
 * @route PATCH /api/v1/mobile-app/locations/:id/set-default
 * @desc Set a location as default
 * @access Private (requires authentication)
 * @param {number} id - Location ID
 */
router.patch('/:id/set-default', authenticate, mobileLocationController.setDefaultLocation);

module.exports = router;