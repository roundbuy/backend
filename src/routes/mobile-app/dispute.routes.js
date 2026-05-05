const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const disputeController = require('../../controllers/mobile-app/dispute.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');

// All dispute routes require authentication and active subscription
router.use(authMiddleware.authenticate);
router.use(subscriptionMiddleware.checkSubscription);

/**
 * @route   GET /api/mobile-app/disputes/categories
 * @desc    Get dispute categories
 * @access  Private
 */
router.get('/categories', disputeController.getDisputeCategories);

/**
 * @route   GET /api/mobile-app/disputes/stats
 * @desc    Get user's dispute statistics
 * @access  Private
 */
router.get('/stats', disputeController.getDisputeStats);

/**
 * @route   POST /api/mobile-app/disputes
 * @desc    Create a new dispute
 * @access  Private
 */
router.post(
  '/',
  [
    body('advertisement_id')
      .notEmpty()
      .withMessage('Advertisement ID is required')
      .isInt()
      .withMessage('Advertisement ID must be a valid integer'),
    body('dispute_type')
      .notEmpty()
      .withMessage('Dispute type is required')
      .isIn(['buyer_initiated', 'seller_initiated', 'transaction_dispute', 'exchange', 'issue_negotiation'])
      .withMessage('Invalid dispute type'),
    body('dispute_category')
      .notEmpty()
      .withMessage('Dispute category is required')
      .isString()
      .withMessage('Dispute category must be a string'),
    body('problem_description')
      .notEmpty()
      .withMessage('Problem description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Problem description must be between 10 and 2000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level')
  ],
  disputeController.createDispute
);

/**
 * @route   GET /api/mobile-app/disputes
 * @desc    Get user's disputes
 * @access  Private
 */
router.get('/', disputeController.getUserDisputes);

/**
 * @route   GET /api/mobile-app/disputes/number/:disputeNumber
 * @desc    Get dispute by dispute number
 * @access  Private
 */
router.get('/number/:disputeNumber', disputeController.getDisputeByNumber);

/**
 * @route   GET /api/mobile-app/disputes/:id
 * @desc    Get dispute by ID
 * @access  Private
 */
router.get('/:id', disputeController.getDisputeById);

/**
 * @route   POST /api/mobile-app/disputes/:id/messages
 * @desc    Add message to dispute
 * @access  Private
 */
router.post(
  '/:id/messages',
  [
    param('id')
      .isInt()
      .withMessage('Dispute ID must be a valid integer'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters'),
    body('message_type')
      .optional()
      .isIn(['text', 'status_update', 'resolution_offer', 'counteroffer'])
      .withMessage('Invalid message type')
  ],
  disputeController.addDisputeMessage
);

/**
 * @route   GET /api/mobile-app/disputes/:id/messages
 * @desc    Get dispute messages
 * @access  Private
 */
router.get('/:id/messages', disputeController.getDisputeMessages);

/**
 * @route   POST /api/mobile-app/disputes/:id/evidence
 * @desc    Upload dispute evidence
 * @access  Private
 */
router.post(
  '/:id/evidence',
  disputeController.uploadMiddleware.single('file'),
  disputeController.uploadEvidence
);

/**
 * @route   GET /api/mobile-app/disputes/:id/evidence
 * @desc    Get dispute evidence
 * @access  Private
 */
router.get('/:id/evidence', disputeController.getDisputeEvidence);

/**
 * @route   POST /api/mobile-app/disputes/:id/check-eligibility
 * @desc    Check dispute eligibility
 * @access  Private
 */
router.post(
  '/:id/check-eligibility',
  [
    param('id')
      .isInt()
      .withMessage('Dispute ID must be a valid integer'),
    body('checks')
      .isArray({ min: 1 })
      .withMessage('Eligibility checks are required and must be an array')
  ],
  disputeController.checkEligibility
);

/**
 * @route   GET /api/mobile-app/disputes/:id/eligibility
 * @desc    Get eligibility checks for dispute
 * @access  Private
 */
router.get('/:id/eligibility', disputeController.getEligibilityChecks);

/**
 * @route   PUT /api/mobile-app/disputes/:id/status
 * @desc    Update dispute status
 * @access  Private
 */
router.put(
  '/:id/status',
  [
    param('id')
      .isInt()
      .withMessage('Dispute ID must be a valid integer'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'under_review', 'awaiting_response', 'negotiating', 'resolved', 'settled', 'closed', 'escalated'])
      .withMessage('Invalid status'),
    body('confirmation')
      .optional()
      .isIn(['confirmed', 'pending'])
      .withMessage('Invalid confirmation type')
  ],
  disputeController.updateDisputeStatus
);

/**
 * @route   POST /api/mobile-app/disputes/:id/seller-response
 * @desc    Send seller's response to dispute
 * @access  Private
 */
router.post(
  '/:id/seller-response',
  [
    param('id')
      .isInt()
      .withMessage('Dispute ID must be a valid integer'),
    body('response')
      .notEmpty()
      .withMessage('Response is required')
      .isLength({ min: 2, max: 2000 })
      .withMessage('Response must be between 2 and 2000 characters'),
    body('decision')
      .notEmpty()
      .withMessage('Decision is required')
      .isIn(['accept', 'decline', 'negotiate'])
      .withMessage('Decision must be "accept", "decline", or "negotiate"')
  ],
  disputeController.sendSellerResponse
);

/**
 * @route   POST /api/mobile-app/disputes/:id/suggestions
 * @desc    Add negotiation suggestion
 * @access  Private
 */
router.post(
  '/:id/suggestions',
  [
    param('id').isInt().withMessage('Dispute ID must be a valid integer'),
    body('suggestion').notEmpty().withMessage('Suggestion is required')
  ],
  disputeController.addNegotiationSuggestion
);

/**
 * @route   POST /api/mobile-app/disputes/:id/decide-negotiation
 * @desc    Decide on negotiation
 * @access  Private
 */
router.post(
  '/:id/decide-negotiation',
  [
    param('id').isInt().withMessage('Dispute ID must be a valid integer'),
    body('decision').isIn(['accept', 'decline']).withMessage('Invalid decision')
  ],
  disputeController.decideNegotiation
);

/**
 * @route   POST /api/mobile-app/disputes/:id/submit-negotiation-decision
 * @desc    Submit negotiation decision
 * @access  Private
 */
router.post(
  '/:id/submit-negotiation-decision',
  [
    param('id').isInt().withMessage('Dispute ID must be a valid integer'),
    body('decision')
      .notEmpty()
      .withMessage('Decision is required')
      .isIn(['accept', 'decline'])
      .withMessage('Invalid decision'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
  ],
  disputeController.submitNegotiationDecision
);

module.exports = router;