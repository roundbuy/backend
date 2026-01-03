const express = require('express');
const router = express.Router();
const supportController = require('../../controllers/mobile-app/supportController');
const resolutionController = require('../../controllers/mobile-app/resolutionController');
const { authenticate } = require('../../middleware/auth.middleware');

// ==========================================
// SUPPORT ROUTES
// ==========================================

// Get all support items
router.get('/support/all', authenticate, supportController.getAllSupport);

// Get ad appeals
router.get('/support/appeals', authenticate, supportController.getAdAppeals);

// ==========================================
// RESOLUTION CENTER ROUTES
// ==========================================

// Get all resolution items
router.get('/resolution/all', authenticate, resolutionController.getAllResolution);

// Get exchanges
router.get('/resolution/exchanges', authenticate, resolutionController.getExchanges);

// Get issues
router.get('/resolution/issues', authenticate, resolutionController.getIssues);

// Get ended cases
router.get('/resolution/ended', authenticate, resolutionController.getEndedCases);

module.exports = router;
