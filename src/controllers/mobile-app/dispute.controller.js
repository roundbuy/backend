const { validationResult } = require('express-validator');
const disputeService = require('../../services/dispute.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/disputes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `dispute-${uniqueSuffix}${path.extname(file.originalname)}`);
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

class DisputeController {
  /**
   * Create a new dispute
   * POST /api/mobile-app/disputes
   */
  async createDispute(req, res) {
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
        advertisement_id,
        dispute_type,
        dispute_category,
        problem_description,
        priority
      } = req.body;

      // Check if user can create dispute for this ad
      const canCreate = await disputeService.canCreateDispute(userId, advertisement_id);
      if (!canCreate) {
        return res.status(400).json({
          success: false,
          message: 'You already have an open dispute for this advertisement'
        });
      }

      const dispute = await disputeService.createDispute({
        user_id: userId,
        advertisement_id,
        dispute_type,
        dispute_category,
        problem_description,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        data: dispute
      });
    } catch (error) {
      console.error('Create dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating dispute',
        error: error.message
      });
    }
  }

  /**
   * Get user's disputes
   * GET /api/mobile-app/disputes
   */
  async getUserDisputes(req, res) {
    try {
      const userId = req.user.id;
      const { status, dispute_type, limit } = req.query;

      const disputes = await disputeService.getUserDisputes(userId, {
        status,
        dispute_type,
        limit
      });

      res.json({
        success: true,
        data: disputes
      });
    } catch (error) {
      console.error('Get user disputes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes',
        error: error.message
      });
    }
  }

  /**
   * Get dispute by ID
   * GET /api/mobile-app/disputes/:id
   */
  async getDisputeById(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;

      const dispute = await disputeService.getDisputeById(disputeId, userId);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      res.json({
        success: true,
        data: dispute
      });
    } catch (error) {
      console.error('Get dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dispute',
        error: error.message
      });
    }
  }

  /**
   * Get dispute by dispute number
   * GET /api/mobile-app/disputes/number/:disputeNumber
   */
  async getDisputeByNumber(req, res) {
    try {
      const userId = req.user.id;
      const disputeNumber = req.params.disputeNumber;

      const dispute = await disputeService.getDisputeByNumber(disputeNumber, userId);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      res.json({
        success: true,
        data: dispute
      });
    } catch (error) {
      console.error('Get dispute by number error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dispute',
        error: error.message
      });
    }
  }

  /**
   * Add message to dispute
   * POST /api/mobile-app/disputes/:id/messages
   */
  async addDisputeMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const disputeId = req.params.id;
      const { message, message_type } = req.body;

      const newMessage = await disputeService.addDisputeMessage(
        disputeId,
        userId,
        message,
        message_type
      );

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: newMessage
      });
    } catch (error) {
      console.error('Add dispute message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding message',
        error: error.message
      });
    }
  }

  /**
   * Get dispute messages
   * GET /api/mobile-app/disputes/:id/messages
   */
  async getDisputeMessages(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;

      const messages = await disputeService.getDisputeMessages(disputeId, userId);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get dispute messages error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching messages',
        error: error.message
      });
    }
  }

  /**
   * Upload dispute evidence
   * POST /api/mobile-app/disputes/:id/evidence
   */
  async uploadEvidence(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 
                      req.file.mimetype === 'application/pdf' ? 'document' : 'other';

      const evidence = await disputeService.uploadEvidence(disputeId, userId, {
        file_type: fileType,
        file_path: `/uploads/disputes/${req.file.filename}`,
        file_name: req.file.originalname,
        file_size: req.file.size,
        description: req.body.description
      });

      res.status(201).json({
        success: true,
        message: 'Evidence uploaded successfully',
        data: evidence
      });
    } catch (error) {
      console.error('Upload evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading evidence',
        error: error.message
      });
    }
  }

  /**
   * Get dispute evidence
   * GET /api/mobile-app/disputes/:id/evidence
   */
  async getDisputeEvidence(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;

      const evidence = await disputeService.getDisputeEvidence(disputeId, userId);

      res.json({
        success: true,
        data: evidence
      });
    } catch (error) {
      console.error('Get dispute evidence error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching evidence',
        error: error.message
      });
    }
  }

  /**
   * Check dispute eligibility
   * POST /api/mobile-app/disputes/:id/check-eligibility
   */
  async checkEligibility(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;
      const { checks } = req.body;

      if (!Array.isArray(checks) || checks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Eligibility checks are required'
        });
      }

      await disputeService.checkEligibility(disputeId, checks);

      res.json({
        success: true,
        message: 'Eligibility checks completed'
      });
    } catch (error) {
      console.error('Check eligibility error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking eligibility',
        error: error.message
      });
    }
  }

  /**
   * Get eligibility checks
   * GET /api/mobile-app/disputes/:id/eligibility
   */
  async getEligibilityChecks(req, res) {
    try {
      const userId = req.user.id;
      const disputeId = req.params.id;

      const checks = await disputeService.getEligibilityChecks(disputeId, userId);

      res.json({
        success: true,
        data: checks
      });
    } catch (error) {
      console.error('Get eligibility checks error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching eligibility checks',
        error: error.message
      });
    }
  }

  /**
   * Update dispute status
   * PUT /api/mobile-app/disputes/:id/status
   */
  async updateDisputeStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const disputeId = req.params.id;
      const { status, resolution_status } = req.body;

      await disputeService.updateDisputeStatus(disputeId, userId, status, {
        resolution_status
      });

      res.json({
        success: true,
        message: 'Dispute status updated successfully'
      });
    } catch (error) {
      console.error('Update dispute status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating dispute status',
        error: error.message
      });
    }
  }

  /**
   * Get dispute statistics
   * GET /api/mobile-app/disputes/stats
   */
  async getDisputeStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await disputeService.getDisputeStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dispute stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dispute statistics',
        error: error.message
      });
    }
  }

  /**
   * Get dispute categories
   * GET /api/mobile-app/disputes/categories
   */
  async getDisputeCategories(req, res) {
    try {
      const categories = disputeService.getDisputeCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get dispute categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dispute categories',
        error: error.message
      });
    }
  }
}

// Create controller instance
const controller = new DisputeController();

// Export controller methods and upload middleware
module.exports = {
  createDispute: controller.createDispute.bind(controller),
  getUserDisputes: controller.getUserDisputes.bind(controller),
  getDisputeById: controller.getDisputeById.bind(controller),
  getDisputeByNumber: controller.getDisputeByNumber.bind(controller),
  addDisputeMessage: controller.addDisputeMessage.bind(controller),
  getDisputeMessages: controller.getDisputeMessages.bind(controller),
  uploadEvidence: controller.uploadEvidence.bind(controller),
  getDisputeEvidence: controller.getDisputeEvidence.bind(controller),
  checkEligibility: controller.checkEligibility.bind(controller),
  getEligibilityChecks: controller.getEligibilityChecks.bind(controller),
  updateDisputeStatus: controller.updateDisputeStatus.bind(controller),
  getDisputeStats: controller.getDisputeStats.bind(controller),
  getDisputeCategories: controller.getDisputeCategories.bind(controller),
  uploadMiddleware: upload
};