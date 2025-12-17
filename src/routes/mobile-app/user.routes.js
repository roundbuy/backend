const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { getUserById, updateUser } = require('../../controllers/user.controller');

console.log('Imported functions:', { getUserById, updateUser });

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

module.exports = router;