const express = require('express');
const router = express.Router();
const kycAdminController = require('../../controllers/admin/kyc.admin.controller');
const { authenticateAdmin } = require('../../middleware/admin.middleware');

/**
 * @route GET /api/v1/admin/kyc
 * @desc Get all KYC/KYB submissions (paginated, filterable)
 */
router.get('/', authenticateAdmin, kycAdminController.getAllSubmissions);

/**
 * @route GET /api/v1/admin/kyc/:id
 * @desc Get single KYC/KYB submission details
 */
router.get('/:id', authenticateAdmin, kycAdminController.getSubmission);

/**
 * @route PUT /api/v1/admin/kyc/:id
 * @desc Approve or Reject a KYC submission
 */
router.put('/:id', authenticateAdmin, kycAdminController.reviewSubmission);

module.exports = router;
