const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const messagingController = require('../../controllers/mobile-app/messaging.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');

// All messaging routes require authentication and active subscription
router.use(authMiddleware.authenticate);
router.use(subscriptionMiddleware.checkSubscription);

// Get user's conversations
router.get('/conversations',
  messagingController.getConversations
);

// Get messages in a conversation
router.get('/conversations/:conversationId/messages',
  messagingController.getConversationMessages
);

// Send a message
router.post('/messages',
  [
    body('advertisement_id').isInt().withMessage('Valid advertisement ID is required'),
    body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
  ],
  messagingController.sendMessage
);

// Make an offer
router.post('/offers',
  [
    body('conversation_id').isInt().withMessage('Valid conversation ID is required'),
    body('offered_price').isFloat({ min: 0.01 }).withMessage('Valid price is required'),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('Message too long')
  ],
  messagingController.makeOffer
);

// Respond to offer
router.put('/offers/:offerId',
  [
    body('action').isIn(['accept', 'reject', 'counter']).withMessage('Invalid action'),
    body('counter_price').optional().isFloat({ min: 0.01 }).withMessage('Valid counter price required')
  ],
  messagingController.respondToOffer
);

// Get offers for a conversation
router.get('/conversations/:conversationId/offers',
  messagingController.getConversationOffers
);

module.exports = router;