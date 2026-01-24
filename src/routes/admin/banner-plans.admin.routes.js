const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const bannerPlansController = require('../../controllers/admin/banner-plans.admin.controller');

// All routes require authentication and admin/editor role
router.use(authenticate);
router.use(authorize('admin', 'editor'));

/**
 * @route   GET /api/v1/admin/banner-plans
 * @desc    Get all banner plans
 * @access  Admin, Editor
 */
router.get('/', bannerPlansController.getAllPlans);

/**
 * @route   GET /api/v1/admin/banner-plans/:id
 * @desc    Get single banner plan by ID
 * @access  Admin, Editor
 */
router.get('/:id', bannerPlansController.getPlanById);

/**
 * @route   POST /api/v1/admin/banner-plans
 * @desc    Create new banner plan (with Stripe integration)
 * @access  Admin, Editor
 */
router.post('/', bannerPlansController.createPlan);

/**
 * @route   PUT /api/v1/admin/banner-plans/:id
 * @desc    Update banner plan (updates Stripe prices)
 * @access  Admin, Editor
 */
router.put('/:id', bannerPlansController.updatePlan);

/**
 * @route   DELETE /api/v1/admin/banner-plans/:id
 * @desc    Delete (archive) banner plan
 * @access  Admin only
 */
router.delete('/:id', authorize('admin'), bannerPlansController.deletePlan);

module.exports = router;
