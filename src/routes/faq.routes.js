/**
 * Public FAQ Routes
 * 
 * Public-facing routes for fetching FAQs.
 * No authentication required.
 */

const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');

// Get all categories with subcategories
router.get('/categories', faqController.getCategories);

// Get organized FAQs (hierarchical structure)
router.get('/organized', faqController.getOrganizedFaqs);

// Search FAQs
router.get('/search', faqController.searchFaqs);

// Get all FAQs (with optional filters)
router.get('/', faqController.getAllFaqs);

// Get single FAQ by ID
router.get('/:id', faqController.getFaqById);

module.exports = router;
