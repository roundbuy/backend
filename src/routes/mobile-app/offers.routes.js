const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const {
  getReceivedOffers,
  acceptOffer,
  declineOffer,
  getAcceptedOffers,
  getDeclinedOffers,
  getMadeOffers
} = require('../../controllers/mobile-app/offers.controller');

/**
 * @route GET /api/v1/mobile-app/offers/received
 * @desc Get offers received for user's advertisements
 * @access Private
 */
router.get('/received', authenticate, getReceivedOffers);

/**
 * @route PUT /api/v1/mobile-app/offers/:id/accept
 * @desc Accept an offer
 * @access Private
 */
router.put('/:id/accept', authenticate, acceptOffer);

/**
 * @route PUT /api/v1/mobile-app/offers/:id/decline
 * @desc Decline an offer
 * @access Private
 */
router.put('/:id/decline', authenticate, declineOffer);

/**
 * @route GET /api/v1/mobile-app/offers/accepted
 * @desc Get accepted offers for user
 * @access Private
 */
router.get('/accepted', authenticate, getAcceptedOffers);

/**
 * @route GET /api/v1/mobile-app/offers/declined
 * @desc Get declined offers for user
 * @access Private
 */
router.get('/declined', authenticate, getDeclinedOffers);

/**
 * @route GET /api/v1/mobile-app/offers/made
 * @desc Get offers made by user as buyer
 * @access Private
 */
router.get('/made', authenticate, getMadeOffers);

module.exports = router;