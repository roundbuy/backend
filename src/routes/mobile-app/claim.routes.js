const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const claimController = require('../../controllers/mobile-app/claim.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const subscriptionMiddleware = require('../../middleware/subscription.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/claim-evidence/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'claim-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// Apply authentication and subscription middleware to all routes
router.use(authMiddleware.authenticate);
router.use(subscriptionMiddleware.checkSubscription);

/**
 * @route   POST /api/mobile-app/claims
 * @desc    Create new claim
 * @access  Private (Authenticated users with active subscription)
 */
router.post(
    '/',
    [
        body('dispute_id').isInt().withMessage('Valid dispute ID is required'),
        body('claim_reason').trim().notEmpty().withMessage('Claim reason is required'),
        body('additional_evidence').optional().trim(),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
    ],
    claimController.createClaim
);

/**
 * @route   GET /api/mobile-app/claims
 * @desc    Get user's claims
 * @access  Private
 */
router.get('/', claimController.getUserClaims);

/**
 * @route   GET /api/mobile-app/claims/:id
 * @desc    Get claim by ID
 * @access  Private
 */
router.get(
    '/:id',
    [param('id').isInt().withMessage('Valid claim ID is required')],
    claimController.getClaimById
);

/**
 * @route   POST /api/mobile-app/claims/:id/messages
 * @desc    Add message to claim
 * @access  Private
 */
router.post(
    '/:id/messages',
    [
        param('id').isInt().withMessage('Valid claim ID is required'),
        body('message').trim().notEmpty().withMessage('Message is required')
    ],
    claimController.addClaimMessage
);

/**
 * @route   GET /api/mobile-app/claims/:id/messages
 * @desc    Get claim messages
 * @access  Private
 */
router.get(
    '/:id/messages',
    [param('id').isInt().withMessage('Valid claim ID is required')],
    claimController.getClaimMessages
);

/**
 * @route   POST /api/mobile-app/claims/:id/evidence
 * @desc    Upload claim evidence
 * @access  Private
 */
router.post(
    '/:id/evidence',
    upload.single('file'),
    [
        param('id').isInt().withMessage('Valid claim ID is required'),
        body('file_type').optional().isIn(['image', 'document', 'video', 'other']),
        body('description').optional().trim()
    ],
    claimController.uploadEvidence
);

/**
 * @route   GET /api/mobile-app/claims/:id/evidence
 * @desc    Get claim evidence
 * @access  Private
 */
router.get(
    '/:id/evidence',
    [param('id').isInt().withMessage('Valid claim ID is required')],
    claimController.getClaimEvidence
);

/**
 * @route   PUT /api/mobile-app/claims/:id/close
 * @desc    Close claim
 * @access  Private
 */
router.put(
    '/:id/close',
    [param('id').isInt().withMessage('Valid claim ID is required')],
    claimController.closeClaim
);

module.exports = router;
