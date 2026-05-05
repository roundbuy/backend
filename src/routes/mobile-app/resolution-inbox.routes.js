const express = require('express');
const router = express.Router();
const resolutionInboxController = require('../../controllers/mobile-app/resolution-inbox.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Requires authentication
router.get('/', authMiddleware.authenticate, resolutionInboxController.getResolutionInbox);

module.exports = router;
