const express = require('express');
const router = express.Router();
const { getColors, getColorShade } = require('../../controllers/mobile-app/colors.controller');

/**
 * @route GET /api/v1/mobile-app/colors
 * @desc Get all colors with shades
 * @access Public
 */
router.get('/', getColors);

/**
 * @route GET /api/v1/mobile-app/colors/shade/:id
 * @desc Get specific color shade by ID
 * @access Public
 */
router.get('/shade/:id', getColorShade);

module.exports = router;
