const express = require('express');
const router = express.Router();
const eventsController = require('../../controllers/mobile-app/events.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Optional auth middleware for GET routes
const optionalAuth = (req, res, next) => {
    // If there's an auth header, run authenticate, else next()
    if (req.headers.authorization) {
        return authenticate(req, res, next);
    }
    next();
};

/**
 * @route GET /api/v1/mobile-app/events
 * @desc Get all events (upcoming, live, finished)
 */
router.get('/', optionalAuth, eventsController.getAllEvents);

/**
 * @route GET /api/v1/mobile-app/events/:id
 * @desc Get single event detail
 */
router.get('/:id', optionalAuth, eventsController.getEventById);

/**
 * @route POST /api/v1/mobile-app/events/:id/subscribe
 * @desc Subscribe to an upcoming event
 */
router.post('/:id/subscribe', authenticate, eventsController.subscribeToEvent);

/**
 * @route DELETE /api/v1/mobile-app/events/:id/subscribe
 * @desc Unsubscribe from an event
 */
router.delete('/:id/subscribe', authenticate, eventsController.unsubscribeFromEvent);

/**
 * @route POST /api/v1/mobile-app/events/:id/follow
 * @desc Follow an event
 */
router.post('/:id/follow', authenticate, eventsController.followEvent);

/**
 * @route DELETE /api/v1/mobile-app/events/:id/follow
 * @desc Unfollow an event
 */
router.delete('/:id/follow', authenticate, eventsController.unfollowEvent);

/**
 * @route POST /api/v1/mobile-app/events/:id/join
 * @desc Join live room (creates participant record)
 */
router.post('/:id/join', authenticate, eventsController.joinLiveRoom);

/**
 * @route GET /api/v1/mobile-app/events/:id/participants
 * @desc Get list of participants in live room
 */
router.get('/:id/participants', authenticate, eventsController.getLiveParticipants);

// --- ADMIN ROUTES ---
// In a full implementation, these might be in an admin-specific routes file and protected by an admin auth middleware.
// For now, they are here for completeness of Phase 3 backend.

router.post('/', authenticate, eventsController.createEvent);
router.put('/:id', authenticate, eventsController.updateEvent);
router.delete('/:id', authenticate, eventsController.deleteEvent);

module.exports = router;
