const express = require('express');
const router = express.Router();
const supportAdminController = require('../../controllers/admin/support.admin.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { checkAdminRole } = require('../../middleware/admin.middleware');

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(checkAdminRole(['admin', 'super_admin', 'support_staff']));

// ==================== SUPPORT TICKETS ====================

// Get all tickets
router.get('/tickets', supportAdminController.getTickets);

// Get ticket statistics
router.get('/tickets/stats', supportAdminController.getStats);

// Get ticket details
router.get('/tickets/:id', supportAdminController.getTicketDetail);

// Assign ticket to staff
router.put('/tickets/:id/assign', supportAdminController.assignTicket);

// Update ticket priority
router.put('/tickets/:id/priority', supportAdminController.updatePriority);

// Reply to ticket
router.post('/tickets/:id/reply', supportAdminController.replyToTicket);

// Close ticket
router.put('/tickets/:id/close', supportAdminController.closeTicket);

// Add internal note
router.post('/tickets/:id/note', supportAdminController.addNote);

module.exports = router;
