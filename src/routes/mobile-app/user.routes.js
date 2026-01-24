const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { getUserById, updateUser } = require('../../controllers/user.controller');
const {
  updateProfileImage,
  verifyCredentials,
  sendVerificationCode,
  verifyCode,
  submitDataRequest,
  getDataRequests,
  getDataRequest,
  checkUsernameAvailability,
  updateUsername
} = require('../../controllers/mobile-app/user.controller');

console.log('Imported functions:', { getUserById, updateUser, updateProfileImage });

/**
 * @route POST /api/v1/mobile-app/user/profile-image
 * @desc Upload/Update user's profile image
 * @access Private
 */
router.post('/profile-image', authenticate, updateProfileImage);

/**
 * @route GET /api/v1/mobile-app/user/profile
 * @desc Get current user's profile information
 * @access Private
 */
router.get('/profile', authenticate, async (req, res) => {
  req.params.id = req.user.id;
  return getUserById(req, res);
});

/**
 * @route PUT /api/v1/mobile-app/user/profile
 * @desc Update current user's profile information
 * @access Private
 */
router.put('/profile', authenticate, async (req, res) => {
  req.params.id = req.user.id;
  return updateUser(req, res);
});

/**
 * @route POST /api/v1/mobile-app/user/verify-credentials
 * @desc Verify user credentials for access rights confirmation
 * @access Public
 */
router.post('/verify-credentials', verifyCredentials);

/**
 * @route POST /api/v1/mobile-app/user/send-verification-code
 * @desc Send verification code to email
 * @access Public
 */
router.post('/send-verification-code', sendVerificationCode);

/**
 * @route POST /api/v1/mobile-app/user/verify-code
 * @desc Verify email verification code
 * @access Public
 */
router.post('/verify-code', verifyCode);

/**
 * @route POST /api/v1/mobile-app/user/data-request
 * @desc Submit a data management request (GDPR compliance)
 * @access Private
 */
router.post('/data-request', authenticate, submitDataRequest);

/**
 * @route GET /api/v1/mobile-app/user/data-requests
 * @desc Get all data requests for current user
 * @access Private
 */
router.get('/data-requests', authenticate, getDataRequests);

/**
 * @route GET /api/v1/mobile-app/user/data-request/:id
 * @desc Get specific data request by ID
 * @access Private
 */
router.get('/data-request/:id', authenticate, getDataRequest);

/**
 * @route POST /api/v1/mobile-app/user/check-username
 * @desc Check if username is available
 * @access Public
 */
router.post('/check-username', checkUsernameAvailability);

/**
 * @route PUT /api/v1/mobile-app/user/username
 * @desc Update user's username
 * @access Private
 */
router.put('/username', authenticate, updateUsername);

module.exports = router;