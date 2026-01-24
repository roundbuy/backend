const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const pickupController = require('../controllers/mobile-app/pickup.controller');

/**
 * Pickup Schedule Routes
 * All routes require authentication
 */

// Schedule a new pickup
router.post(
    '/schedule',
    authenticate,
    pickupController.schedulePickup
);

// Get all pickups for current user
router.get(
    '/',
    authenticate,
    pickupController.getUserPickups
);

// Get current pickup fees
router.get(
    '/fees',
    authenticate,
    pickupController.getPickupFees
);

// Get unpaid pickups
router.get(
    '/unpaid',
    authenticate,
    pickupController.getUnpaidPickups
);

// Get single pickup details
router.get(
    '/:pickupId',
    authenticate,
    pickupController.getPickupDetails
);

// Confirm pickup (seller only)
router.put(
    '/:pickupId/confirm',
    authenticate,
    pickupController.confirmPickup
);

// Reschedule pickup
router.put(
    '/:pickupId/reschedule',
    authenticate,
    pickupController.reschedulePickup
);

// Mark pickup as completed
router.put(
    '/:pickupId/complete',
    authenticate,
    pickupController.completePickup
);

// Cancel pickup
router.delete(
    '/:pickupId/cancel',
    authenticate,
    pickupController.cancelPickup
);

module.exports = router;
