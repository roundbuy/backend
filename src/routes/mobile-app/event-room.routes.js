const express = require('express');
const router = express.Router();
const eventRoomController = require('../../controllers/mobile-app/event-room.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware'); // Assuming multer upload is here

/**
 * @route GET /api/v1/mobile-app/events/item/:itemId
 * @desc Get event item details by ID
 */
router.get('/item/:itemId', authenticate, eventRoomController.getEventItemDetails);

/**
 * @route GET /api/v1/mobile-app/events/:id/room/stream
 * @desc SSE connection for real-time room updates
 */
router.get('/:id/room/stream', authenticate, eventRoomController.streamRoom);

/**
 * @route GET /api/v1/mobile-app/events/:id/room
 * @desc Get initial room state
 */
router.get('/:id/room', authenticate, eventRoomController.getRoomState);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/items
 * @desc Upload an item for bidding
 */
// Use upload middleware for single image. Field name usually 'image' or 'images' depending on the app's standard.
router.post('/:id/room/items', authenticate, upload.single('image'), eventRoomController.uploadItem);

/**
 * @route GET /api/v1/mobile-app/events/:id/room/items
 * @desc Get all items in the room
 */
router.get('/:id/room/items', authenticate, eventRoomController.getItems);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/bids
 * @desc Place a bid on an item
 */
router.post('/:id/room/bids', authenticate, eventRoomController.placeBid);

/**
 * @route GET /api/v1/mobile-app/events/:id/room/chat
 * @desc Get chat messages
 */
router.get('/:id/room/chat', authenticate, eventRoomController.getChat);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/chat
 * @desc Send a chat message
 */
router.post('/:id/room/chat', authenticate, eventRoomController.sendChat);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/link-product
 * @desc Link an existing advertisement as a featured product in the room
 */
router.post('/:id/room/link-product', authenticate, eventRoomController.linkProduct);

/**
 * @route GET /api/v1/mobile-app/events/:id/room/bids
 * @desc Get all bids for all items in the room (for the Bids & Offers panel)
 */
router.get('/:id/room/bids', authenticate, eventRoomController.getRoomBids);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/bids/:bidId/accept
 * @desc Item owner accepts a specific bid (marks item sold, notifies winner)
 */
router.post('/:id/room/bids/:bidId/accept', authenticate, eventRoomController.acceptBid);

/**
 * @route POST /api/v1/mobile-app/events/:id/room/bids/:bidId/decline
 * @desc Item owner declines a specific bid
 */
router.post('/:id/room/bids/:bidId/decline', authenticate, eventRoomController.declineBid);

module.exports = router;
