const express = require('express');
const router = express.Router();
const offersController = require('../../controllers/mobile-app/offers.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');

// All offer routes require authentication and active subscription
router.use(authMiddleware.authenticate);
router.use(subscriptionMiddleware.checkSubscription);

// Get all offers for the current user
// Query params: type (buyer/seller/all), status (pending/accepted/rejected/counter_offered), page, limit
router.get('/',
  offersController.getUserOffers
);

// Get offer statistics for the current user
router.get('/stats',
  offersController.getOfferStats
);

// Get offers for a specific advertisement
router.get('/advertisement/:advertisementId',
  offersController.getAdvertisementOffers
);

// Accept an offer
router.post('/:offerId/accept',
  offersController.acceptOffer
);

// Reject/Decline an offer
router.post('/:offerId/reject',
  offersController.rejectOffer
);

module.exports = router;