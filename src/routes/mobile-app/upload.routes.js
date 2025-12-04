const express = require('express');
const router = express.Router();
const uploadController = require('../../controllers/mobile-app/upload.controller');
const { authenticate } = require('../../middleware/auth.middleware');

/**
 * @route POST /api/v1/mobile-app/upload/images
 * @desc Upload image files
 * @access Private (requires authentication)
 */
router.post('/images', authenticate, uploadController.uploadImages);

module.exports = router;