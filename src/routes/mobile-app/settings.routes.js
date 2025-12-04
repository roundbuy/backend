const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/mobile-app/settings.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route GET /api/v1/mobile-app/settings/languages
 * @desc Get all available languages
 * @access Public
 */
router.get('/languages', settingsController.getLanguages);

/**
 * @route GET /api/v1/mobile-app/settings/currencies
 * @desc Get all available currencies
 * @access Public
 */
router.get('/currencies', settingsController.getCurrencies);

/**
 * @route GET /api/v1/mobile-app/settings/countries
 * @desc Get all available countries
 * @access Public
 */
router.get('/countries', settingsController.getCountries);

/**
 * @route GET /api/v1/mobile-app/settings/preferences
 * @desc Get user's language, country, and currency preferences
 * @access Private (requires authentication)
 */
router.get('/preferences', authenticate, settingsController.getUserPreferences);

/**
 * @route PUT /api/v1/mobile-app/settings/preferences
 * @desc Update user's language, country, and currency preferences
 * @access Private (requires authentication)
 * @body {string} language_preference - Language code (e.g., 'en', 'hi')
 * @body {string} country_code - Country code (e.g., 'IND', 'USA')
 * @body {string} currency_code - Currency code (e.g., 'INR', 'USD')
 */
router.put('/preferences', authenticate, settingsController.updateUserPreferences);

module.exports = router;