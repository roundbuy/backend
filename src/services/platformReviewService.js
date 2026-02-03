const { promisePool } = require('../config/database');

/**
 * Create a new platform review (app or site)
 */
const createReview = async (userId, type, rating, experience, improvements) => {
    try {
        const query = `
            INSERT INTO platform_reviews (user_id, type, rating, experience, improvements)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await promisePool.query(query, [userId, type, rating, experience, improvements]);
        return { id: result.insertId, userId, type, rating, experience, improvements };
    } catch (error) {
        console.error('Error in createReview:', error);
        throw error;
    }
};

/**
 * Get reviews by type
 */
const getReviews = async (type, limit = 50, offset = 0) => {
    try {
        const query = `
            SELECT pr.*, u.full_name, u.avatar 
            FROM platform_reviews pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.type = ?
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [reviews] = await promisePool.query(query, [type, limit, offset]);

        // Get stats
        const statsQuery = `
            SELECT 
                COUNT(*) as total, 
                AVG(rating) as average 
            FROM platform_reviews 
            WHERE type = ?
        `;
        const [stats] = await promisePool.query(statsQuery, [type]);

        return {
            reviews,
            stats: {
                totalReviews: stats[0].total || 0,
                averageRating: parseFloat(stats[0].average || 0)
            }
        };
    } catch (error) {
        console.error('Error in getReviews:', error);
        throw error;
    }
};

/**
 * Check if user has already reviewed
 */
const hasUserReviewed = async (userId, type) => {
    try {
        const query = `SELECT id FROM platform_reviews WHERE user_id = ? AND type = ?`;
        const [rows] = await promisePool.query(query, [userId, type]);
        return rows.length > 0;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createReview,
    getReviews,
    hasUserReviewed
};
