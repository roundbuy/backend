const { promisePool } = require('../../config/database');

/**
 * Resolution Controller
 * Handles resolution center endpoints for mobile app
 */

/**
 * Get all resolution items (disputes + exchanges + issues)
 */
exports.getAllResolution = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get disputes
        const [disputes] = await promisePool.query(
            `SELECT id, dispute_number as reference, 
              COALESCE(dispute_category, 'Dispute') as title, 
              problem_description as description, 
              status, created_at, 'dispute' as type
       FROM disputes 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Format items
        const allItems = disputes.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            status: item.status,
            time: formatTimeAgo(item.created_at),
            created_at: item.created_at
        }));

        res.json({
            success: true,
            data: allItems
        });
    } catch (error) {
        console.error('Get all resolution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resolution items',
            error_code: 'FETCH_ERROR'
        });
    }
};

/**
 * Get exchanges
 */
exports.getExchanges = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [exchanges] = await promisePool.query(
            `SELECT id, 
              COALESCE(dispute_category, 'Exchange') as title, 
              problem_description as description, 
              status, created_at
       FROM disputes 
       WHERE user_id = ? AND dispute_type = 'exchange'
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        const formattedExchanges = exchanges.map(exchange => ({
            id: exchange.id,
            title: exchange.title,
            description: exchange.description,
            status: exchange.status,
            time: formatTimeAgo(exchange.created_at),
            created_at: exchange.created_at
        }));

        res.json({
            success: true,
            data: formattedExchanges
        });
    } catch (error) {
        console.error('Get exchanges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exchanges',
            error_code: 'FETCH_ERROR'
        });
    }
};

/**
 * Get issues
 */
exports.getIssues = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [issues] = await promisePool.query(
            `SELECT id, 
              COALESCE(dispute_category, 'Issue') as title, 
              problem_description as description, 
              status, created_at
       FROM disputes 
       WHERE user_id = ? AND dispute_type = 'issue'
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        const formattedIssues = issues.map(issue => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            time: formatTimeAgo(issue.created_at),
            created_at: issue.created_at
        }));

        res.json({
            success: true,
            data: formattedIssues
        });
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch issues',
            error_code: 'FETCH_ERROR'
        });
    }
};

/**
 * Get ended cases
 */
exports.getEndedCases = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [endedCases] = await promisePool.query(
            `SELECT id, dispute_number as reference, 
              COALESCE(dispute_category, 'Resolved Case') as title, 
              problem_description as description, 
              status, resolution_status, closed_at as created_at
       FROM disputes 
       WHERE user_id = ? AND status IN ('resolved', 'closed')
       ORDER BY closed_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        const formattedCases = endedCases.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            resolution: item.resolution_status,
            time: formatTimeAgo(item.created_at),
            created_at: item.created_at
        }));

        res.json({
            success: true,
            data: formattedCases
        });
    } catch (error) {
        console.error('Get ended cases error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ended cases',
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

module.exports = exports;
