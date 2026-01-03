const express = require('express');
const router = express.Router();
const multer = require('multer');
const issueController = require('../../controllers/mobile-app/issue.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/issues/',
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only PDF and images
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'));
        }
    }
});

/**
 * Issue Routes
 * All routes require authentication
 */

// Create issue
router.post('/', authenticate, issueController.createIssue);

// Get user's issues
router.get('/', authenticate, issueController.getUserIssues);

// Get issue by ID
router.get('/:issueId', authenticate, issueController.getIssueById);

// Seller responds to issue
router.post('/:issueId/respond', authenticate, issueController.respondToIssue);

// Close issue (buyer)
router.post('/:issueId/close', authenticate, issueController.closeIssue);

// Escalate to dispute
router.post('/:issueId/escalate', authenticate, issueController.escalateToDispute);

// Upload evidence
router.post('/:issueId/evidence', authenticate, upload.single('file'), issueController.uploadEvidence);

// Get evidence
router.get('/:issueId/evidence', authenticate, issueController.getEvidence);

// Add message
router.post('/:issueId/messages', authenticate, issueController.addMessage);

// Get messages
router.get('/:issueId/messages', authenticate, issueController.getMessages);

module.exports = router;
