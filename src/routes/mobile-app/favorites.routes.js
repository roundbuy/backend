const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const favoritesController = require('../../controllers/mobile-app/favorites.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get user's favorites
router.get('/', favoritesController.getUserFavorites);

// Check if advertisement is favorited by user
router.get('/check/:advertisement_id', favoritesController.checkFavoriteStatus);

// Add advertisement to favorites
router.post('/', [
  body('advertisement_id').isInt().withMessage('Valid advertisement ID required')
], favoritesController.addToFavorites);

// Remove advertisement from favorites
router.delete('/:advertisement_id', favoritesController.removeFromFavorites);

module.exports = router;