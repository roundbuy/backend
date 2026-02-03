const feedbackService = require('../services/feedbackService');

/**
 * Get advertisements/offers where user can give feedback
 * GET /api/feedbacks/eligible
 */
const getEligibleForFeedback = async (req, res) => {
    try {
        const userId = req.user.id;

        const eligibleTransactions = await feedbackService.getEligibleForFeedback(userId);

        res.json({
            success: true,
            data: {
                transactions: eligibleTransactions,
                count: eligibleTransactions.length
            }
        });
    } catch (error) {
        console.error('Error in getEligibleForFeedback controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch eligible transactions for feedback',
            error: error.message
        });
    }
};

/**
 * Create a new feedback
 * POST /api/feedbacks
 */
const createFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            advertisementId,
            offerId,
            reviewedUserId,
            rating,
            comment,
            transactionType
        } = req.body;

        // Validation
        if (!advertisementId || !reviewedUserId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: advertisementId, reviewedUserId, rating'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if user can give feedback
        const eligibilityCheck = await feedbackService.canGiveFeedback(
            userId,
            advertisementId,
            offerId
        );

        if (!eligibilityCheck.canGive) {
            return res.status(403).json({
                success: false,
                message: eligibilityCheck.reason || 'Cannot give feedback for this transaction'
            });
        }

        // Create feedback
        const feedback = await feedbackService.createFeedback({
            advertisementId,
            offerId: offerId || null,
            reviewerId: userId,
            reviewedUserId,
            rating,
            comment: comment || '',
            transactionType: transactionType || 'sell'
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error in createFeedback controller:', error);

        if (error.message === 'Feedback already submitted for this transaction') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

/**
 * Get feedbacks received by current user
 * GET /api/feedbacks/my-feedbacks
 */
const getMyFeedbacks = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const status = req.query.status || null;

        const feedbacks = await feedbackService.getUserFeedbacks(userId, limit, offset, status);
        const stats = await feedbackService.getFeedbackStats(userId);

        res.json({
            success: true,
            data: {
                feedbacks,
                stats,
                pagination: {
                    limit,
                    offset,
                    count: feedbacks.length
                }
            }
        });
    } catch (error) {
        console.error('Error in getMyFeedbacks controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedbacks',
            error: error.message
        });
    }
};

/**
 * Get feedbacks for a specific user (public)
 * GET /api/feedbacks/user/:userId
 */
const getUserFeedbacks = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const feedbacks = await feedbackService.getUserFeedbacks(userId, limit, offset);
        const stats = await feedbackService.getFeedbackStats(userId);

        res.json({
            success: true,
            data: {
                feedbacks,
                stats,
                pagination: {
                    limit,
                    offset,
                    count: feedbacks.length
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserFeedbacks controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user feedbacks',
            error: error.message
        });
    }
};

/**
 * Get feedback statistics for a user
 * GET /api/feedbacks/stats/:userId
 */
const getFeedbackStats = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const stats = await feedbackService.getFeedbackStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getFeedbackStats controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback statistics',
            error: error.message
        });
    }
};

/**
 * Check if user can give feedback for a transaction
 * GET /api/feedbacks/can-give/:advertisementId
 */
const checkCanGiveFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const advertisementId = parseInt(req.params.advertisementId);
        const offerId = req.query.offerId ? parseInt(req.query.offerId) : null;

        if (!advertisementId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid advertisement ID'
            });
        }

        const result = await feedbackService.canGiveFeedback(
            userId,
            advertisementId,
            offerId
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in checkCanGiveFeedback controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check feedback eligibility',
            error: error.message
        });
    }
};

/**
 * Get feedbacks given by current user
 * GET /api/feedbacks/given
 */
const getGivenFeedbacks = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const feedbacks = await feedbackService.getGivenFeedbacks(userId, limit, offset);

        res.json({
            success: true,
            data: {
                feedbacks,
                pagination: {
                    limit,
                    offset,
                    count: feedbacks.length
                }
            }
        });
    } catch (error) {
        console.error('Error in getGivenFeedbacks controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch given feedbacks',
            error: error.message
        });
    }
};

/**
 * Update a feedback (content)
 * PUT /api/feedbacks/:id
 */
const updateFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const feedbackId = parseInt(req.params.id);
        const { rating, comment } = req.body;

        if (!rating) {
            return res.status(400).json({
                success: false,
                message: 'Rating is required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        await feedbackService.updateFeedback(feedbackId, userId, rating, comment);

        res.json({
            success: true,
            message: 'Feedback updated successfully'
        });
    } catch (error) {
        console.error('Error in updateFeedback controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update feedback',
            error: error.message
        });
    }
};

/**
 * Update feedback status (approve/reject)
 * PATCH /api/feedbacks/:id/status
 */
const updateFeedbackStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const feedbackId = parseInt(req.params.id);
        const { status } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected"'
            });
        }

        await feedbackService.updateFeedbackStatus(feedbackId, userId, status);

        res.json({
            success: true,
            message: `Feedback ${status} successfully`
        });
    } catch (error) {
        console.error('Error in updateFeedbackStatus controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update feedback status',
            error: error.message
        });
    }
};

module.exports = {
    getEligibleForFeedback,
    createFeedback,
    getMyFeedbacks,
    getUserFeedbacks,
    getFeedbackStats,
    checkCanGiveFeedback,
    getGivenFeedbacks,
    updateFeedback,
    updateFeedbackStatus
};
