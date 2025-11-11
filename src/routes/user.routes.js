const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', authenticate, userController.updateUser);

// Get user's products
router.get('/:id/products', userController.getUserProducts);

// Get user's reviews
router.get('/:id/reviews', userController.getUserReviews);

module.exports = router;