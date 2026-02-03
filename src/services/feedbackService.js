const { promisePool } = require('../config/database');

/**
 * Feedback Service
 * Handles all feedback-related business logic
 */

/**
 * Get advertisements/offers where user can give feedback
 * Returns completed transactions where user hasn't given feedback yet
 */
const getEligibleForFeedback = async (userId) => {
    try {
        const query = `
      SELECT DISTINCT
        a.id as advertisement_id,
        a.title,
        a.images,
        a.price,
        act.name as activity_type,
        o.id as offer_id,
        o.offered_price,
        o.status as offer_status,
        o.created_at as transaction_date,
        CASE 
          WHEN a.user_id = ? THEN c.buyer_id
          ELSE a.user_id
        END as other_party_id,
        CASE 
          WHEN a.user_id = ? THEN buyer.full_name
          ELSE seller.full_name
        END as other_party_name,
        CASE 
          WHEN a.user_id = ? THEN buyer.avatar
          ELSE seller.avatar
        END as other_party_avatar,
        CASE 
          WHEN a.user_id = ? THEN 'sell'
          ELSE 'buy'
        END as transaction_type,
        af.id as existing_feedback_id
      FROM conversations c
      INNER JOIN advertisements a ON c.advertisement_id = a.id
      INNER JOIN users seller ON a.user_id = seller.id
      INNER JOIN users buyer ON c.buyer_id = buyer.id
      LEFT JOIN ad_activities act ON a.activity_id = act.id
      LEFT JOIN offers o ON o.conversation_id = c.id AND o.status = 'accepted'
      LEFT JOIN advertisement_feedbacks af ON (
        af.advertisement_id = a.id 
        AND af.reviewer_id = ?
        AND (af.offer_id = o.id OR (af.offer_id IS NULL AND o.id IS NULL))
      )
      WHERE (c.buyer_id = ? OR a.user_id = ?)
        AND o.status = 'accepted'
        AND af.id IS NULL
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

        const [rows] = await promisePool.query(query, [
            userId, userId, userId, userId, userId, userId, userId
        ]);

        // Format the response
        return rows.map(row => ({
            advertisementId: row.advertisement_id,
            offerId: row.offer_id,
            title: row.title,
            images: row.images ? JSON.parse(row.images) : [],
            price: parseFloat(row.price),
            offeredPrice: row.offered_price ? parseFloat(row.offered_price) : null,
            activityType: row.activity_type,
            transactionType: row.transaction_type,
            transactionDate: row.transaction_date,
            otherParty: {
                id: row.other_party_id,
                name: row.other_party_name,
                avatar: row.other_party_avatar
            },
            hasFeedback: row.existing_feedback_id !== null
        }));
    } catch (error) {
        console.error('Error in getEligibleForFeedback:', error);
        throw error;
    }
};

/**
 * Create a new feedback
 */
const createFeedback = async (feedbackData) => {
    const {
        advertisementId,
        offerId,
        reviewerId,
        reviewedUserId,
        rating,
        comment,
        transactionType
    } = feedbackData;

    try {
        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Check if feedback already exists
        const checkQuery = `
      SELECT id FROM advertisement_feedbacks 
      WHERE reviewer_id = ? 
        AND advertisement_id = ? 
        AND (offer_id = ? OR (offer_id IS NULL AND ? IS NULL))
    `;
        const [existing] = await promisePool.query(checkQuery, [
            reviewerId, advertisementId, offerId, offerId
        ]);

        if (existing.length > 0) {
            throw new Error('Feedback already submitted for this transaction');
        }

        // Insert feedback
        const insertQuery = `
      INSERT INTO advertisement_feedbacks 
      (advertisement_id, offer_id, reviewer_id, reviewed_user_id, rating, comment, transaction_type, status, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)
    `;

        const [result] = await promisePool.query(insertQuery, [
            advertisementId,
            offerId || null,
            reviewerId,
            reviewedUserId,
            rating,
            comment,
            transactionType
        ]);

        // Update user's cached rating
        await updateUserRating(reviewedUserId);

        return {
            id: result.insertId,
            advertisementId,
            offerId,
            reviewerId,
            reviewedUserId,
            rating,
            comment,
            transactionType
        };
    } catch (error) {
        console.error('Error in createFeedback:', error);
        throw error;
    }
};

/**
 * Get all feedbacks received by a user
 */
const getUserFeedbacks = async (userId, limit = 50, offset = 0, status = null) => {
    try {
        const query = `
      SELECT 
        af.id,
        af.rating,
        af.comment,
        af.transaction_type,
        af.status,
        af.created_at,
        a.id as advertisement_id,
        a.title as advertisement_title,
        a.images as advertisement_images,
        reviewer.id as reviewer_id,
        reviewer.full_name as reviewer_name,
        reviewer.avatar as reviewer_avatar
      FROM advertisement_feedbacks af
      INNER JOIN advertisements a ON af.advertisement_id = a.id
      INNER JOIN users reviewer ON af.reviewer_id = reviewer.id
      WHERE af.reviewed_user_id = ?
        AND (af.is_visible = TRUE OR af.reviewed_user_id = ?)
        ${status ? 'AND af.status = ?' : ''}
      ORDER BY af.created_at DESC
      LIMIT ? OFFSET ?
    `;

        const params = status ? [userId, userId, status, limit, offset] : [userId, userId, limit, offset];
        const [rows] = await promisePool.query(query, params);

        return rows.map(row => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment,
            transactionType: row.transaction_type,
            status: row.status,
            createdAt: row.created_at,
            advertisement: {
                id: row.advertisement_id,
                title: row.advertisement_title,
                images: row.advertisement_images ? JSON.parse(row.advertisement_images) : []
            },
            reviewer: {
                id: row.reviewer_id,
                name: row.reviewer_name,
                avatar: row.reviewer_avatar
            }
        }));
    } catch (error) {
        console.error('Error in getUserFeedbacks:', error);
        throw error;
    }
};

/**
 * Get feedbacks given by a user
 */
const getGivenFeedbacks = async (userId, limit = 50, offset = 0) => {
    try {
        const query = `
      SELECT 
        af.id,
        af.rating,
        af.comment,
        af.transaction_type,
        af.status,
        af.created_at,
        af.updated_at,
        a.id as advertisement_id,
        a.title as advertisement_title,
        a.images as advertisement_images,
        reviewed.id as reviewed_user_id,
        reviewed.full_name as reviewed_user_name,
        reviewed.avatar as reviewed_user_avatar
      FROM advertisement_feedbacks af
      INNER JOIN advertisements a ON af.advertisement_id = a.id
      INNER JOIN users reviewed ON af.reviewed_user_id = reviewed.id
      WHERE af.reviewer_id = ?
      ORDER BY af.created_at DESC
      LIMIT ? OFFSET ?
    `;

        const [rows] = await promisePool.query(query, [userId, limit, offset]);

        return rows.map(row => ({
            id: row.id,
            rating: row.rating,
            comment: row.comment,
            transactionType: row.transaction_type,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            advertisement: {
                id: row.advertisement_id,
                title: row.advertisement_title,
                images: row.advertisement_images ? JSON.parse(row.advertisement_images) : []
            },
            reviewedUser: {
                id: row.reviewed_user_id,
                name: row.reviewed_user_name,
                avatar: row.reviewed_user_avatar
            }
        }));
    } catch (error) {
        console.error('Error in getGivenFeedbacks:', error);
        throw error;
    }
};

/**
 * Update feedback content (only within 30 days)
 */
const updateFeedback = async (feedbackId, userId, rating, comment) => {
    try {
        // Check existence and ownership
        const [feedback] = await promisePool.query(
            'SELECT * FROM advertisement_feedbacks WHERE id = ? AND reviewer_id = ?',
            [feedbackId, userId]
        );

        if (feedback.length === 0) {
            throw new Error('Feedback not found or access denied');
        }

        const createdAt = new Date(feedback[0].created_at);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now - createdAt) / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            throw new Error('Feedback cannot be edited after 30 days');
        }

        // Update
        await promisePool.query(
            'UPDATE advertisement_feedbacks SET rating = ?, comment = ? WHERE id = ?',
            [rating, comment, feedbackId]
        );

        // Recalculate rating for the reviewed user
        await updateUserRating(feedback[0].reviewed_user_id);

        return { success: true };
    } catch (error) {
        console.error('Error in updateFeedback:', error);
        throw error;
    }
};

/**
 * Update feedback status (approve/reject)
 */
const updateFeedbackStatus = async (feedbackId, userId, status) => {
    try {
        // Verify the user is the one who received the feedback
        const [feedback] = await promisePool.query(
            'SELECT * FROM advertisement_feedbacks WHERE id = ? AND reviewed_user_id = ?',
            [feedbackId, userId]
        );

        if (feedback.length === 0) {
            throw new Error('Feedback not found or access denied');
        }

        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('Invalid status');
        }

        await promisePool.query(
            'UPDATE advertisement_feedbacks SET status = ?, is_visible = ? WHERE id = ?',
            [status, status === 'approved' ? 1 : 0, feedbackId]
        );

        // Recalculate stats only if visibility changed or status changed to/from approved
        await updateUserRating(userId);

        return { success: true };
    } catch (error) {
        console.error('Error in updateFeedbackStatus:', error);
        throw error;
    }
};

/**
 * Get feedback statistics for a user
 */
const getFeedbackStats = async (userId) => {
    try {
        const query = `
      SELECT 
        COUNT(*) as total_feedbacks,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as positive_percentage,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as negative_percentage,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as neutral_percentage,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM advertisement_feedbacks
      WHERE reviewed_user_id = ?
        AND is_visible = TRUE
    `;

        const [rows] = await promisePool.query(query, [userId]);

        if (rows.length === 0 || rows[0].total_feedbacks === 0) {
            return {
                totalFeedbacks: 0,
                averageRating: 0,
                positivePercentage: 0,
                negativePercentage: 0,
                neutralPercentage: 0,
                ratingDistribution: {
                    fiveStar: 0,
                    fourStar: 0,
                    threeStar: 0,
                    twoStar: 0,
                    oneStar: 0
                }
            };
        }

        const stats = rows[0];
        return {
            totalFeedbacks: parseInt(stats.total_feedbacks),
            averageRating: parseFloat(stats.average_rating).toFixed(2),
            positivePercentage: Math.round(parseFloat(stats.positive_percentage)),
            negativePercentage: Math.round(parseFloat(stats.negative_percentage)),
            neutralPercentage: Math.round(parseFloat(stats.neutral_percentage)),
            ratingDistribution: {
                fiveStar: parseInt(stats.five_star) || 0,
                fourStar: parseInt(stats.four_star) || 0,
                threeStar: parseInt(stats.three_star) || 0,
                twoStar: parseInt(stats.two_star) || 0,
                oneStar: parseInt(stats.one_star) || 0
            }
        };
    } catch (error) {
        console.error('Error in getFeedbackStats:', error);
        throw error;
    }
};

/**
 * Update user's cached rating in users table
 */
const updateUserRating = async (userId) => {
    try {
        const query = `
      UPDATE users 
      SET 
        average_rating = (
          SELECT AVG(rating) 
          FROM advertisement_feedbacks 
          WHERE reviewed_user_id = ? AND is_visible = TRUE
        ),
        total_feedbacks = (
          SELECT COUNT(*) 
          FROM advertisement_feedbacks 
          WHERE reviewed_user_id = ? AND is_visible = TRUE
        )
      WHERE id = ?
    `;

        await promisePool.query(query, [userId, userId, userId]);
    } catch (error) {
        console.error('Error in updateUserRating:', error);
        // Don't throw error, just log it
    }
};

/**
 * Check if user can give feedback for a specific advertisement/offer
 */
const canGiveFeedback = async (userId, advertisementId, offerId = null) => {
    try {
        // Check if user is part of the conversation
        const conversationQuery = `
      SELECT c.id, a.user_id as seller_id, c.buyer_id
      FROM conversations c
      INNER JOIN advertisements a ON c.advertisement_id = a.id
      WHERE c.advertisement_id = ?
        AND (c.buyer_id = ? OR a.user_id = ?)
    `;

        const [conversations] = await promisePool.query(conversationQuery, [
            advertisementId, userId, userId
        ]);

        if (conversations.length === 0) {
            return { canGive: false, reason: 'Not part of this transaction' };
        }

        // Check if there's an accepted offer
        if (offerId) {
            const offerQuery = `
        SELECT status FROM offers WHERE id = ? AND status = 'accepted'
      `;
            const [offers] = await promisePool.query(offerQuery, [offerId]);

            if (offers.length === 0) {
                return { canGive: false, reason: 'Offer not accepted' };
            }
        }

        // Check if feedback already exists
        const feedbackQuery = `
      SELECT id FROM advertisement_feedbacks
      WHERE reviewer_id = ?
        AND advertisement_id = ?
        AND (offer_id = ? OR (offer_id IS NULL AND ? IS NULL))
    `;

        const [existingFeedback] = await promisePool.query(feedbackQuery, [
            userId, advertisementId, offerId, offerId
        ]);

        if (existingFeedback.length > 0) {
            return { canGive: false, reason: 'Feedback already given' };
        }

        return { canGive: true };
    } catch (error) {
        console.error('Error in canGiveFeedback:', error);
        throw error;
    }
};

module.exports = {
    getEligibleForFeedback,
    createFeedback,
    getUserFeedbacks,
    getFeedbackStats,
    updateUserRating,
    canGiveFeedback,
    getGivenFeedbacks,
    updateFeedback,
    updateFeedbackStatus
};
