const express = require('express');
const router = express.Router();
const issueAdminController = require('../../controllers/admin/issue.admin.controller');
const disputeAdminController = require('../../controllers/admin/dispute.admin.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { checkAdminRole } = require('../../middleware/admin.middleware');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(checkAdminRole(['admin', 'super_admin']));

// ==================== ISSUES ====================

// Get all issues
router.get('/issues', issueAdminController.getIssues);

// Get issue statistics
router.get('/issues/stats', issueAdminController.getStats);

// Get issue details
router.get('/issues/:id', issueAdminController.getIssueDetail);

// Extend issue deadline
router.put('/issues/:id/extend-deadline', issueAdminController.extendDeadline);

// Force accept issue
router.put('/issues/:id/force-accept', issueAdminController.forceAccept);

// Force reject issue
router.put('/issues/:id/force-reject', issueAdminController.forceReject);

// Close issue
router.put('/issues/:id/close', issueAdminController.closeIssue);

// Add admin note to issue
router.post('/issues/:id/note', issueAdminController.addNote);

// ==================== DISPUTES ====================

// Get all disputes
router.get('/disputes', disputeAdminController.getDisputes);

// Get dispute statistics
router.get('/disputes/stats', disputeAdminController.getStats);

// Get dispute details
router.get('/disputes/:id', disputeAdminController.getDisputeDetail);

// Assign dispute to staff
router.put('/disputes/:id/assign', disputeAdminController.assignDispute);

// Update dispute priority
router.put('/disputes/:id/priority', disputeAdminController.updatePriority);

// Extend dispute deadline
router.put('/disputes/:id/extend-deadline', disputeAdminController.extendDeadline);

// Resolve dispute
router.post('/disputes/:id/resolve', disputeAdminController.resolveDispute);

// Close dispute
router.put('/disputes/:id/close', disputeAdminController.closeDispute);

// Add admin note to dispute
router.post('/disputes/:id/note', disputeAdminController.addNote);

module.exports = router;
