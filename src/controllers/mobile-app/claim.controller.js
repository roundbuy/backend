const claimService = require('../../services/claim.service');
const { validationResult } = require('express-validator');

class ClaimController {
    /**
     * Create new claim
     * POST /api/mobile-app/claims
     */
    async createClaim(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { dispute_id, claim_reason, additional_evidence, priority } = req.body;

            const claim = await claimService.createClaim(dispute_id, userId, {
                claim_reason,
                additional_evidence,
                priority
            });

            res.status(201).json({
                success: true,
                message: 'Claim created successfully',
                data: claim
            });
        } catch (error) {
            console.error('Create claim error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create claim'
            });
        }
    }

    /**
     * Get user's claims
     * GET /api/mobile-app/claims
     */
    async getUserClaims(req, res) {
        try {
            const userId = req.user.id;
            const { status, limit } = req.query;

            const claims = await claimService.getUserClaims(userId, {
                status,
                limit
            });

            res.json({
                success: true,
                data: claims
            });
        } catch (error) {
            console.error('Get claims error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch claims'
            });
        }
    }

    /**
     * Get claim by ID
     * GET /api/mobile-app/claims/:id
     */
    async getClaimById(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const claim = await claimService.getClaimById(id, userId);

            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            res.json({
                success: true,
                data: claim
            });
        } catch (error) {
            console.error('Get claim error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch claim'
            });
        }
    }

    /**
     * Add claim message
     * POST /api/mobile-app/claims/:id/messages
     */
    async addClaimMessage(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { id } = req.params;
            const { message } = req.body;

            // Verify user has access to claim
            const claim = await claimService.getClaimById(id, userId);
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            const messageId = await claimService.addClaimMessage(id, userId, message);

            res.status(201).json({
                success: true,
                message: 'Message added successfully',
                data: { id: messageId }
            });
        } catch (error) {
            console.error('Add message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add message'
            });
        }
    }

    /**
     * Get claim messages
     * GET /api/mobile-app/claims/:id/messages
     */
    async getClaimMessages(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            // Verify user has access to claim
            const claim = await claimService.getClaimById(id, userId);
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            const messages = await claimService.getClaimMessages(id);

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch messages'
            });
        }
    }

    /**
     * Upload claim evidence
     * POST /api/mobile-app/claims/:id/evidence
     */
    async uploadEvidence(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            // Verify user has access to claim
            const claim = await claimService.getClaimById(id, userId);
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const evidenceData = {
                file_type: req.body.file_type || 'document',
                file_path: req.file.path,
                file_name: req.file.originalname,
                file_size: req.file.size,
                description: req.body.description
            };

            const evidenceId = await claimService.uploadClaimEvidence(id, userId, evidenceData);

            res.status(201).json({
                success: true,
                message: 'Evidence uploaded successfully',
                data: { id: evidenceId }
            });
        } catch (error) {
            console.error('Upload evidence error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload evidence'
            });
        }
    }

    /**
     * Get claim evidence
     * GET /api/mobile-app/claims/:id/evidence
     */
    async getClaimEvidence(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            // Verify user has access to claim
            const claim = await claimService.getClaimById(id, userId);
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }

            const evidence = await claimService.getClaimEvidence(id);

            res.json({
                success: true,
                data: evidence
            });
        } catch (error) {
            console.error('Get evidence error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch evidence'
            });
        }
    }

    /**
     * Close claim
     * PUT /api/mobile-app/claims/:id/close
     */
    async closeClaim(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await claimService.closeClaim(id, userId);

            res.json({
                success: true,
                message: 'Claim closed successfully'
            });
        } catch (error) {
            console.error('Close claim error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to close claim'
            });
        }
    }
}

module.exports = new ClaimController();
