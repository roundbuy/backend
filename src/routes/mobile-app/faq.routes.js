const express = require('express');
const router = express.Router();
const faqController = require('../../controllers/mobile-app/faq.controller');

/**
 * @route GET /api/v1/mobile-app/faqs/categories
 * @desc Get all FAQ categories with counts (lightweight)
 * @access Public
 */
router.get('/categories', faqController.getCategories);

/**
 * @route GET /api/v1/mobile-app/faqs/search
 * @desc Search FAQs by question or answer
 * @access Public
 * @query {string} q - Search query (minimum 2 characters)
 */
router.get('/search', faqController.searchFaqs);

/**
 * @route GET /api/v1/mobile-app/faqs/category/:categoryId
 * @desc Get all FAQs for a specific category
 * @access Public
 * @param {number} categoryId - Category ID
 */
router.get('/category/:categoryId', faqController.getFaqsByCategory);

/**
 * @route GET /api/v1/mobile-app/faqs/:id
 * @desc Get single FAQ by ID
 * @access Public
 * @param {number} id - FAQ ID
 */
router.get('/:id', faqController.getFaqById);

/**
 * @route GET /api/v1/mobile-app/faqs
 * @desc Get all active FAQs grouped by category and subcategory
 * @access Public
 * @query {number} category_id - Optional: Filter by category ID
 */
router.get('/', faqController.getActiveFaqs);

module.exports = router;
