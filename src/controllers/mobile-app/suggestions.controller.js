const { promisePool } = require('../../config/database');

exports.submitSuggestion = async (req, res) => {
    try {
        const { page_route, rating, feedback_tags, comment } = req.body;
        const userId = req.user ? req.user.id : null; // Optional user context

        if (!rating) {
            return res.status(400).json({
                success: false,
                message: 'Rating is required'
            });
        }

        const tagsString = Array.isArray(feedback_tags) ? JSON.stringify(feedback_tags) : feedback_tags;

        await promisePool.query(
            'INSERT INTO app_suggestions (user_id, page_route, rating, feedback_tags, comment) VALUES (?, ?, ?, ?, ?)',
            [userId, page_route, rating, tagsString, comment]
        );

        res.json({
            success: true,
            message: 'Suggestion submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit suggestion'
        });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [suggestions] = await promisePool.query(
            `SELECT s.*, u.full_name, u.email 
             FROM app_suggestions s 
             LEFT JOIN users u ON s.user_id = u.id 
             ORDER BY s.created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countResult] = await promisePool.query('SELECT COUNT(*) as total FROM app_suggestions');
        const total = countResult[0].total;

        // Parse tags if stored as string
        const formattedSuggestions = suggestions.map(s => ({
            ...s,
            feedback_tags: typeof s.feedback_tags === 'string' ? JSON.parse(s.feedback_tags || '[]') : s.feedback_tags
        }));

        res.json({
            success: true,
            data: {
                suggestions: formattedSuggestions,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suggestions'
        });
    }
};
