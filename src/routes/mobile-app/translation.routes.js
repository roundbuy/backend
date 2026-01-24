const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const translationController = require('../../controllers/mobile-app/translation.controller');

/**
 * @route   GET /api/v1/mobile-app/translations
 * @desc    Get all translations for a language
 * @query   language - Language code (default: 'en')
 * @access  Public
 * @example /api/v1/mobile-app/translations?language=hi
 */
router.get('/', translationController.getTranslations);

/**
 * @route   GET /api/v1/mobile-app/translations/stats
 * @desc    Get translation statistics
 * @access  Public
 */
router.get('/stats', translationController.getTranslationStats);

/**
 * @route   GET /api/v1/mobile-app/translations/languages
 * @desc    Get all available languages
 * @access  Public
 */
router.get('/languages', translationController.getAvailableLanguages);

/**
 * @route   GET /api/v1/mobile-app/translations/user/language
 * @desc    Get user's current language preference
 * @access  Private (requires authentication)
 */
router.get('/user/language', authenticate, translationController.getUserLanguage);

/**
 * @route   PUT /api/v1/mobile-app/translations/user/language
 * @desc    Update user's language preference
 * @body    { language_code: "hi" }
 * @access  Private (requires authentication)
 */
router.put('/user/language', authenticate, translationController.updateUserLanguage);

/**
 * @route   GET /api/v1/mobile-app/translations/:category
 * @desc    Get translations by category
 * @param   category - Category name (auth, products, chat, etc.)
 * @query   language - Language code (default: 'en')
 * @access  Public
 * @example /api/v1/mobile-app/translations/auth?language=es
 */
router.get('/:category', translationController.getTranslationsByCategory);

module.exports = router;
