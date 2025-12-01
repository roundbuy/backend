const express = require('express');
const router = express.Router();
const mobileAuthController = require('../../controllers/mobile-app/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Mobile app authentication routes

/**
 * @route POST /api/v1/mobile-app/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', mobileAuthController.register);

/**
 * @route POST /api/v1/mobile-app/auth/verify-email
 * @desc Verify user email
 * @access Public
 */
router.post('/verify-email', mobileAuthController.verifyEmail);

/**
 * @route POST /api/v1/mobile-app/auth/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post('/resend-verification', mobileAuthController.resendVerification);

/**
 * @route POST /api/v1/mobile-app/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', mobileAuthController.login);

/**
 * @route POST /api/v1/mobile-app/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', mobileAuthController.forgotPassword);

/**
 * @route POST /api/v1/mobile-app/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', mobileAuthController.resetPassword);

/**
 * @route POST /api/v1/mobile-app/auth/change-password
 * @desc Change password (requires authentication)
 * @access Private
 */
router.post('/change-password', authenticate, mobileAuthController.changePassword);

module.exports = router;