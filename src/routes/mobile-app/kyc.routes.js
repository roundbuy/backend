const express = require('express');
const router = express.Router();
const kycController = require('../../controllers/mobile-app/kyc.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

/**
 * @route GET /api/v1/mobile-app/kyc/document-types
 * @desc Get required docs for a specific country
 */
router.get('/document-types', authenticate, kycController.getDocumentTypes);

/**
 * @route POST /api/v1/mobile-app/kyc/submit
 * @desc Submit KYC/KYB documents
 */
router.post('/submit', authenticate, upload.fields([
    { name: 'front_document', maxCount: 1 },
    { name: 'back_document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'business_reg', maxCount: 1 }
]), kycController.submitKyc);

/**
 * @route GET /api/v1/mobile-app/kyc/status
 * @desc Get user's current KYC/KYB status
 */
router.get('/status', authenticate, kycController.getKycStatus);

module.exports = router;
