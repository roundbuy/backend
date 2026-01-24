const express = require('express');
const router = express.Router();
const moderationController = require('../../controllers/mobile-app/moderation.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Check content for moderation violations
router.post('/check', authMiddleware.authenticate, moderationController.checkContent);

module.exports = router;
