const express = require('express');
const router = express.Router();
const trendingAdminController = require('../../controllers/admin/trending.admin.controller');

// Note: Authentication and authorization are handled in the parent admin.routes.js

// Galleries
router.get('/galleries', trendingAdminController.getGalleries);
router.post('/galleries', trendingAdminController.createGallery);
router.put('/galleries/:id', trendingAdminController.updateGallery);
router.delete('/galleries/:id', trendingAdminController.deleteGallery);

// Gallery Items
router.get('/galleries/:id/items', trendingAdminController.getGalleryItems);
router.post('/galleries/:id/items', trendingAdminController.addItemToGallery);
router.delete('/galleries/:id/items/:itemId', trendingAdminController.removeItemFromGallery);
router.put('/galleries/:id/items/reorder', trendingAdminController.reorderItems);

module.exports = router;
