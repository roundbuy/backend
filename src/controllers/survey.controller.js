const { promisePool } = require('../config/database');

exports.submitNps = async (req, res) => {
    try {
        const { score, comment, role } = req.body;
        const userId = req.user ? req.user.id : null;

        if (score === undefined || score < 0 || score > 10) {
            return res.status(400).json({ success: false, message: "Invalid score. Must be between 0 and 10." });
        }

        if (!role || !['buyer', 'seller'].includes(role.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid role. Must be 'buyer' or 'seller'." });
        }

        const query = 'INSERT INTO surveys_nps (user_id, role, score, comment) VALUES (?, ?, ?, ?)';
        await promisePool.query(query, [userId, role.toLowerCase(), score, comment || null]);

        res.status(201).json({ success: true, message: "NPS survey submitted successfully." });
    } catch (error) {
        console.error("Error submitting NPS survey:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.submitBetaFeedback = async (req, res) => {
    try {
        const { round, platform, rating, isPositive, feedbackText } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!round || round < 1 || round > 4) {
            return res.status(400).json({ success: false, message: "Invalid round. Must be 1, 2, 3, or 4." });
        }

        if (!platform || !['web', 'android', 'ios'].includes(platform.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid platform. Must be 'web', 'android', or 'ios'." });
        }

        if (rating === undefined || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Invalid rating. Must be between 1 and 5." });
        }

        const isPos = isPositive !== undefined ? (isPositive ? 1 : 0) : 1;

        const query = 'INSERT INTO surveys_beta_feedback (user_id, round, platform, rating, is_positive, feedback_text) VALUES (?, ?, ?, ?, ?, ?)';
        await promisePool.query(query, [userId, round, platform.toLowerCase(), rating, isPos, feedbackText || null]);

        res.status(201).json({ success: true, message: "Beta feedback submitted successfully." });
    } catch (error) {
        console.error("Error submitting beta feedback:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
