/**
 * Admin FAQ Routes
 * 
 * Routes for managing FAQs, categories, and subcategories.
 * All routes require admin authentication.
 */

const express = require('express');
const router = express.Router();
const faqController = require('../../controllers/admin/faq.admin.controller');

// ==================== FAQ CATEGORIES ====================

// Get all categories
router.get('/categories', faqController.getAllCategories);

// Create category
router.post('/categories', faqController.createCategory);

// Update category
router.put('/categories/:id', faqController.updateCategory);

// Delete category
router.delete('/categories/:id', faqController.deleteCategory);

// ==================== FAQ SUBCATEGORIES ====================

// Get all subcategories (can filter by category_id)
router.get('/subcategories', faqController.getAllSubcategories);

// Create subcategory
router.post('/subcategories', faqController.createSubcategory);

// Update subcategory
router.put('/subcategories/:id', faqController.updateSubcategory);

// Delete subcategory
router.delete('/subcategories/:id', faqController.deleteSubcategory);

// ==================== FAQs ====================

// Bulk operations (must be before :id routes)
router.put('/reorder', faqController.updateSortOrder);
router.patch('/bulk-status', faqController.bulkUpdateStatus);

// Get all FAQs with pagination and filters
router.get('/', faqController.getAllFaqs);

// Get single FAQ by ID
router.get('/:id', faqController.getFaqById);

// Create new FAQ
router.post('/', faqController.createFaq);

// Update FAQ
router.put('/:id', faqController.updateFaq);

// Delete FAQ
router.delete('/:id', faqController.deleteFaq);

module.exports = router;
