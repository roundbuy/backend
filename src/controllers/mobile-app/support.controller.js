const { validationResult } = require('express-validator');
const supportService = require('../../services/support.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/support');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `support-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
});

class SupportController {
  /**
   * Create a new support ticket
   * POST /api/mobile-app/support/tickets
   */
  async createTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const {
        category,
        subject,
        description,
        related_ad_id,
        priority
      } = req.body;

      const ticket = await supportService.createTicket({
        user_id: userId,
        category,
        subject,
        description,
        related_ad_id,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating support ticket',
        error: error.message
      });
    }
  }

  /**
   * Get user's support tickets
   * GET /api/mobile-app/support/tickets
   */
  async getUserTickets(req, res) {
    try {
      const userId = req.user.id;
      const { status, category, limit } = req.query;

      const tickets = await supportService.getUserTickets(userId, {
        status,
        category,
        limit
      });

      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching support tickets',
        error: error.message
      });
    }
  }

  /**
   * Get ticket by ID
   * GET /api/mobile-app/support/tickets/:id
   */
  async getTicketById(req, res) {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;

      const ticket = await supportService.getTicketById(ticketId, userId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching support ticket',
        error: error.message
      });
    }
  }

  /**
   * Get ticket by ticket number
   * GET /api/mobile-app/support/tickets/number/:ticketNumber
   */
  async getTicketByNumber(req, res) {
    try {
      const userId = req.user.id;
      const ticketNumber = req.params.ticketNumber;

      const ticket = await supportService.getTicketByNumber(ticketNumber, userId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Get ticket by number error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching support ticket',
        error: error.message
      });
    }
  }

  /**
   * Add message to ticket
   * POST /api/mobile-app/support/tickets/:id/messages
   */
  async addTicketMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const ticketId = req.params.id;
      const { message } = req.body;

      const newMessage = await supportService.addTicketMessage(
        ticketId,
        userId,
        message
      );

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: newMessage
      });
    } catch (error) {
      console.error('Add ticket message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding message',
        error: error.message
      });
    }
  }

  /**
   * Get ticket messages
   * GET /api/mobile-app/support/tickets/:id/messages
   */
  async getTicketMessages(req, res) {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;

      const messages = await supportService.getTicketMessages(ticketId, userId);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get ticket messages error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching messages',
        error: error.message
      });
    }
  }

  /**
   * Upload ticket attachment
   * POST /api/mobile-app/support/tickets/:id/attachments
   */
  async uploadAttachment(req, res) {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;
      const messageId = req.body.message_id || null;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const attachment = await supportService.uploadAttachment(ticketId, messageId, {
        file_path: `/uploads/support/${req.file.filename}`,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size
      });

      res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: attachment
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading attachment',
        error: error.message
      });
    }
  }

  /**
   * Get ticket attachments
   * GET /api/mobile-app/support/tickets/:id/attachments
   */
  async getTicketAttachments(req, res) {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;

      const attachments = await supportService.getTicketAttachments(ticketId, userId);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      console.error('Get ticket attachments error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching attachments',
        error: error.message
      });
    }
  }

  /**
   * Update ticket status
   * PUT /api/mobile-app/support/tickets/:id/status
   */
  async updateTicketStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const ticketId = req.params.id;
      const { status } = req.body;

      await supportService.updateTicketStatus(ticketId, userId, status);

      res.json({
        success: true,
        message: 'Ticket status updated successfully'
      });
    } catch (error) {
      console.error('Update ticket status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating ticket status',
        error: error.message
      });
    }
  }

  /**
   * Get ticket statistics
   * GET /api/mobile-app/support/tickets/stats
   */
  async getTicketStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await supportService.getTicketStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get ticket stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ticket statistics',
        error: error.message
      });
    }
  }

  /**
   * Get support categories
   * GET /api/mobile-app/support/categories
   */
  async getSupportCategories(req, res) {
    try {
      const categories = supportService.getSupportCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get support categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching support categories',
        error: error.message
      });
    }
  }

  // ==========================================
  // DELETED ADVERTISEMENTS & APPEALS
  // ==========================================

  /**
   * Get user's deleted ads
   * GET /api/mobile-app/support/deleted-ads
   */
  async getDeletedAds(req, res) {
    try {
      const userId = req.user.id;
      const { can_appeal, appeal_status, limit } = req.query;

      const filters = {};
      if (can_appeal !== undefined) {
        filters.can_appeal = can_appeal === 'true';
      }
      if (appeal_status) {
        filters.appeal_status = appeal_status;
      }
      if (limit) {
        filters.limit = limit;
      }

      const deletedAds = await supportService.getDeletedAds(userId, filters);

      res.json({
        success: true,
        data: deletedAds
      });
    } catch (error) {
      console.error('Get deleted ads error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching deleted ads',
        error: error.message
      });
    }
  }

  /**
   * Get deleted ad by ID
   * GET /api/mobile-app/support/deleted-ads/:id
   */
  async getDeletedAdById(req, res) {
    try {
      const userId = req.user.id;
      const deletedAdId = req.params.id;

      const deletedAd = await supportService.getDeletedAdById(deletedAdId, userId);

      if (!deletedAd) {
        return res.status(404).json({
          success: false,
          message: 'Deleted ad not found'
        });
      }

      res.json({
        success: true,
        data: deletedAd
      });
    } catch (error) {
      console.error('Get deleted ad error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching deleted ad',
        error: error.message
      });
    }
  }

  /**
   * Create appeal for deleted ad
   * POST /api/mobile-app/support/deleted-ads/:id/appeal
   */
  async createAppeal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const deletedAdId = req.params.id;
      const { appeal_reason } = req.body;

      const appeal = await supportService.createAppeal(deletedAdId, userId, {
        appeal_reason
      });

      res.status(201).json({
        success: true,
        message: 'Appeal submitted successfully',
        data: appeal
      });
    } catch (error) {
      console.error('Create appeal error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating appeal',
        error: error.message
      });
    }
  }

  /**
   * Get appeal statistics
   * GET /api/mobile-app/support/appeals/stats
   */
  async getAppealStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await supportService.getAppealStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get appeal stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appeal statistics',
        error: error.message
      });
    }
  }

  /**
   * Check if user has open tickets
   * GET /api/mobile-app/support/has-open-tickets
   */
  async hasOpenTickets(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.query;

      const hasOpen = await supportService.hasOpenTickets(userId, category);

      res.json({
        success: true,
        data: { has_open_tickets: hasOpen }
      });
    } catch (error) {
      console.error('Check open tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking open tickets',
        error: error.message
      });
    }
  }
}

// Create controller instance
const controller = new SupportController();

// Export controller methods and upload middleware
module.exports = {
  createTicket: controller.createTicket.bind(controller),
  getUserTickets: controller.getUserTickets.bind(controller),
  getTicketById: controller.getTicketById.bind(controller),
  getTicketByNumber: controller.getTicketByNumber.bind(controller),
  addTicketMessage: controller.addTicketMessage.bind(controller),
  getTicketMessages: controller.getTicketMessages.bind(controller),
  uploadAttachment: controller.uploadAttachment.bind(controller),
  getTicketAttachments: controller.getTicketAttachments.bind(controller),
  updateTicketStatus: controller.updateTicketStatus.bind(controller),
  getTicketStats: controller.getTicketStats.bind(controller),
  getSupportCategories: controller.getSupportCategories.bind(controller),
  getDeletedAds: controller.getDeletedAds.bind(controller),
  getDeletedAdById: controller.getDeletedAdById.bind(controller),
  createAppeal: controller.createAppeal.bind(controller),
  getAppealStats: controller.getAppealStats.bind(controller),
  hasOpenTickets: controller.hasOpenTickets.bind(controller),
  uploadMiddleware: upload
};