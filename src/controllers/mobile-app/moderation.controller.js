const moderationService = require('../../services/moderation.service');

/**
 * Check content for moderation violations
 * POST /api/mobile/moderation/check
 */
exports.checkContent = async (req, res) => {
    try {
        const { text, fields } = req.body;

        // Check if single text or multiple fields
        if (text) {
            const result = await moderationService.checkTextModeration(text);
            return res.json({
                success: true,
                data: result
            });
        }

        if (fields && typeof fields === 'object') {
            const result = await moderationService.checkMultipleFields(fields);
            return res.json({
                success: true,
                data: result
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Please provide either "text" or "fields" parameter'
        });
    } catch (error) {
        console.error('Check content moderation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check content moderation',
            error: error.message
        });
    }
};
