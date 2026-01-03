const { promisePool } = require('../../config/database');

/**
 * Support Controller
 * Handles support-related endpoints for mobile app
 */

/**
 * Get all support items (tickets + deleted ads + appeals)
 */
exports.getAllSupport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get tickets
        const [tickets] = await promisePool.query(
            `SELECT id, ticket_number as reference, subject as title, description, 
              status, created_at, 'ticket' as type
       FROM support_tickets 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Get deleted ads
        const [deletedAds] = await promisePool.query(
            `SELECT id, id as reference, title, 
              COALESCE(deletion_reason_details, description) as description, 
              appeal_status as status, deleted_at as created_at, 'deleted_ad' as type
       FROM deleted_advertisements 
       WHERE user_id = ? 
       ORDER BY deleted_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Combine and format
        const allItems = [...tickets, ...deletedAds].map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            status: item.status,
            time: formatTimeAgo(item.created_at),
            created_at: item.created_at
        }));

        // Sort by created_at
        allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            success: true,
            data: allItems.slice(0, limit)
        });
    } catch (error) {
        console.error('Get all support error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch support items',
            error_code: 'FETCH_ERROR'
        });
    }
};

/**
 * Get ad appeals
 */
exports.getAdAppeals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [appeals] = await promisePool.query(
            `SELECT id, title, 
              COALESCE(deletion_reason_details, description) as description, 
              appeal_status as status, deleted_at as created_at
       FROM deleted_advertisements 
       WHERE user_id = ? AND appeal_status != 'not_appealed'
       ORDER BY deleted_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        const formattedAppeals = appeals.map(appeal => ({
            id: appeal.id,
            title: appeal.title,
            description: appeal.description,
            status: appeal.status,
            time: formatTimeAgo(appeal.created_at),
            created_at: appeal.created_at
        }));

        res.json({
            success: true,
            data: formattedAppeals
        });
    } catch (error) {
        console.error('Get ad appeals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ad appeals',
            error_code: 'FETCH_ERROR'
        });
    }
};

/**
 * Helper function to format time ago
 */
function formatTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else {
        return `${diffDays}d ago`;
    }
}
