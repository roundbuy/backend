const express = require('express');
const router = express.Router();
const messagingAdminController = require('../../controllers/admin/messaging.admin.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkAdminRole } = require('../../middleware/admin.middleware');

// All admin messaging routes require authentication and admin role
router.use(authMiddleware.authenticate);
router.use(checkAdminRole(['admin', 'super_admin']));

// Get all conversations
router.get('/conversations',
    messagingAdminController.getConversations
);

// Get conversation statistics
router.get('/stats',
    messagingAdminController.getStats
);

// Get conversation details
router.get('/conversations/:conversationId',
    messagingAdminController.getConversationDetail
);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages',
    messagingAdminController.getConversationMessages
);

// Delete a conversation
router.delete('/conversations/:conversationId',
    messagingAdminController.deleteConversation
);

// Delete a message
router.delete('/messages/:messageId',
    messagingAdminController.deleteMessage
);

module.exports = router;
