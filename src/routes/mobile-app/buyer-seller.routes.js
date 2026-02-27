const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const buyerSellerController = require('../../controllers/mobile-app/buyer-seller.controller');

// Protect all routes with authentication
router.use(authenticate);

// Step 1: Enquiries
router.get('/enquiries', buyerSellerController.getEnquiries);

// Step 2: Offers
router.post('/offers', buyerSellerController.makeOffer);
router.put('/offers/:offerId/respond', buyerSellerController.respondToOffer);

// Step 3: Delivery Selection (Buyer Pays)
router.post('/offers/:offerId/delivery', buyerSellerController.selectDelivery);

// Step 4: Schedule
router.post('/offers/:offerId/schedule', buyerSellerController.scheduleExchange);

// Step 5: Deal Confirmation
router.post('/offers/:offerId/confirm', buyerSellerController.confirmDeal);

// Action Center Hub
router.get('/action-center', buyerSellerController.getActionCenterMessages);

module.exports = router;
