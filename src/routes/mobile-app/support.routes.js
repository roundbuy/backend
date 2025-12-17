const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const supportController = require('../../controllers/mobile-app/support.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');

// All support routes require authentication and active subscription
router.use(authMiddleware.authenticate);
router.use(subscriptionMiddleware.checkSubscription);

/**
 * @route   GET /api/mobile-app/support/categories
 * @desc    Get support categories
 * @access  Private
 */
router.get('/categories', supportController.getSupportCategories);

/**
 * @route   GET /api/mobile-app/support/tickets/stats
 * @desc    Get user's ticket statistics
 * @access  Private
 */
router.get('/tickets/stats', supportController.getTicketStats);

/**
 * @route   GET /api/mobile-app/support/has-open-tickets
 * @desc    Check if user has open tickets
 * @access  Private
 */
router.get('/has-open-tickets', supportController.hasOpenTickets);

/**
 * @route   POST /api/mobile-app/support/tickets
 * @desc    Create a new support ticket
 * @access  Private
 */
router.post(
  '/tickets',
  [
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['deleted_ads', 'ad_appeal', 'general', 'technical', 'billing', 'account', 'other'])
      .withMessage('Invalid category'),
    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 5, max: 255 })
      .withMessage('Subject must be between 5 and 255 characters'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('related_ad_id')
      .optional()
      .isInt()
      .withMessage('Related ad ID must be a valid integer'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  supportController.createTicket
);

/**
 * @route   GET /api/mobile-app/support/tickets
 * @desc    Get user's support tickets
 * @access  Private
 */
router.get('/tickets', supportController.getUserTickets);

/**
 * @route   GET /api/mobile-app/support/tickets/number/:ticketNumber
 * @desc    Get ticket by ticket number
 * @access  Private
 */
router.get('/tickets/number/:ticketNumber', supportController.getTicketByNumber);

/**
 * @route   GET /api/mobile-app/support/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private
 */
router.get('/tickets/:id', supportController.getTicketById);

/**
 * @route   POST /api/mobile-app/support/tickets/:id/messages
 * @desc    Add message to ticket
 * @access  Private
 */
router.post(
  '/tickets/:id/messages',
  [
    param('id')
      .isInt()
      .withMessage('Ticket ID must be a valid integer'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters')
  ],
  supportController.addTicketMessage
);

/**
 * @route   GET /api/mobile-app/support/tickets/:id/messages
 * @desc    Get ticket messages
 * @access  Private
 */
router.get('/tickets/:id/messages', supportController.getTicketMessages);

/**
 * @route   POST /api/mobile-app/support/tickets/:id/attachments
 * @desc    Upload ticket attachment
 * @access  Private
 */
router.post(
  '/tickets/:id/attachments',
  supportController.uploadMiddleware.single('file'),
  supportController.uploadAttachment
);

/**
 * @route   GET /api/mobile-app/support/tickets/:id/attachments
 * @desc    Get ticket attachments
 * @access  Private
 */
router.get('/tickets/:id/attachments', supportController.getTicketAttachments);

/**
 * @route   PUT /api/mobile-app/support/tickets/:id/status
 * @desc    Update ticket status
 * @access  Private
 */
router.put(
  '/tickets/:id/status',
  [
    param('id')
      .isInt()
      .withMessage('Ticket ID must be a valid integer'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['open', 'in_progress', 'awaiting_user', 'resolved', 'closed'])
      .withMessage('Invalid status')
  ],
  supportController.updateTicketStatus
);

// ==========================================
// DELETED ADVERTISEMENTS & APPEALS ROUTES
// ==========================================

/**
 * @route   GET /api/mobile-app/support/deleted-ads
 * @desc    Get user's deleted ads
 * @access  Private
 */
router.get('/deleted-ads', supportController.getDeletedAds);

/**
 * @route   GET /api/mobile-app/support/deleted-ads/:id
 * @desc    Get deleted ad by ID
 * @access  Private
 */
router.get('/deleted-ads/:id', supportController.getDeletedAdById);

/**
 * @route   POST /api/mobile-app/support/deleted-ads/:id/appeal
 * @desc    Create appeal for deleted ad
 * @access  Private
 */
router.post(
  '/deleted-ads/:id/appeal',
  [
    param('id')
      .isInt()
      .withMessage('Deleted ad ID must be a valid integer'),
    body('appeal_reason')
      .notEmpty()
      .withMessage('Appeal reason is required')
      .isLength({ min: 20, max: 2000 })
      .withMessage('Appeal reason must be between 20 and 2000 characters')
  ],
  supportController.createAppeal
);

/**
 * @route   GET /api/mobile-app/support/appeals/stats
 * @desc    Get appeal statistics
 * @access  Private
 */
router.get('/appeals/stats', supportController.getAppealStats);

module.exports = router;