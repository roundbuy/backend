const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const advertisementPlansController = require('../../controllers/admin/advertisement-plans.admin.controller');

// All routes require authentication and admin/editor role
router.use(authenticate);
router.use(authorize('admin', 'editor'));

/**
 * @route   GET /api/v1/admin/advertisement-plans
 * @desc    Get all advertisement plans
 * @access  Admin, Editor
 */
router.get('/', advertisementPlansController.getAllPlans);

/**
 * @route   GET /api/v1/admin/advertisement-plans/:id
 * @desc    Get single advertisement plan by ID
 * @access  Admin, Editor
 */
router.get('/:id', advertisementPlansController.getPlanById);

/**
 * @route   POST /api/v1/admin/advertisement-plans
 * @desc    Create new advertisement plan (with Stripe integration)
 * @access  Admin, Editor
 */
router.post('/', advertisementPlansController.createPlan);

/**
 * @route   PUT /api/v1/admin/advertisement-plans/:id
 * @desc    Update advertisement plan (updates Stripe prices)
 * @access  Admin, Editor
 */
router.put('/:id', advertisementPlansController.updatePlan);

/**
 * @route   DELETE /api/v1/admin/advertisement-plans/:id
 * @desc    Delete (archive) advertisement plan
 * @access  Admin only
 */
router.delete('/:id', authorize('admin'), advertisementPlansController.deletePlan);

module.exports = router;
