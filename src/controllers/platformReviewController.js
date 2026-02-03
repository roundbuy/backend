const platformReviewService = require('../services/platformReviewService');

const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, rating, experience, improvements } = req.body;

        if (!['app', 'site'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid review type' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Check if already reviewed (optional, maybe we accept multiple?)
        // Let's allow multiple for now as people change their minds, or limit 1 per day/week?
        // Requirement says "Review RoundBuy", usually these are singular. 
        // Let's implement it as append-only log for now, simple. 

        const review = await platformReviewService.createReview(userId, type, rating, experience, improvements);
        res.status(201).json({ success: true, data: review, message: 'Review submitted successfully' });
    } catch (error) {
        console.error('Error creating platform review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

const getReviews = async (req, res) => {
    try {
        const { type } = req.params; // /reviews/:type
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        if (!['app', 'site'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid review type' });
        }

        const data = await platformReviewService.getReviews(type, limit, offset);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching platform reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

module.exports = {
    createReview,
    getReviews
};
