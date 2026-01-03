const { promisePool } = require('../../config/database');

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

/**
 * Get all resolution items (issues + disputes)
 */
exports.getAllResolution = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get issues
        const [issues] = await promisePool.query(
            `SELECT 
                i.id, 
                i.issue_number as reference,
                CONCAT(UPPER(SUBSTRING(i.issue_type, 1, 1)), SUBSTRING(i.issue_type, 2), ' Issue') as title, 
                i.issue_description as description, 
                i.status, 
                i.created_at,
                'issue' as type
            FROM issues i
            WHERE (i.created_by = ? OR i.other_party_id = ?)
            ORDER BY i.created_at DESC 
            LIMIT ?`,
            [userId, userId, parseInt(limit)]
        );

        // Get disputes
        const [disputes] = await promisePool.query(
            `SELECT 
                d.id,
                d.dispute_number as reference,
                COALESCE(d.dispute_category, 'Dispute') as title,
                d.problem_description as description,
                d.status,
                d.created_at,
                'dispute' as type
            FROM disputes d
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
            LIMIT ?`,
            [userId, parseInt(limit)]
        );

        // Combine and sort
        const allItems = [...issues, ...disputes]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, parseInt(limit));

        const formattedItems = allItems.map(item => ({
            id: item.id,
            reference: item.reference,
            title: item.title,
            description: item.description,
            status: item.status,
            time: formatTimeAgo(item.created_at),
            created_at: item.created_at,
            type: item.type
        }));

        res.json({
            success: true,
            data: formattedItems
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
 * Get issues only
 */
exports.getIssues = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [issues] = await promisePool.query(
            `SELECT 
                i.id, 
                i.issue_number as reference,
                CONCAT(UPPER(SUBSTRING(i.issue_type, 1, 1)), SUBSTRING(i.issue_type, 2), ' Issue') as title, 
                i.issue_description as description, 
                i.status, 
                i.created_at,
                i.deadline,
                a.title as ad_title,
                CASE 
                    WHEN i.created_by = ? THEN other.full_name
                    ELSE creator.full_name
                END as other_party_name
            FROM issues i
            LEFT JOIN advertisements a ON i.advertisement_id = a.id
            LEFT JOIN users creator ON i.created_by = creator.id
            LEFT JOIN users other ON i.other_party_id = other.id
            WHERE (i.created_by = ? OR i.other_party_id = ?)
            ORDER BY i.created_at DESC 
            LIMIT ? OFFSET ?`,
            [userId, userId, userId, parseInt(limit), offset]
        );

        const formattedIssues = issues.map(issue => ({
            id: issue.id,
            reference: issue.reference,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            time: formatTimeAgo(issue.created_at),
            created_at: issue.created_at,
            deadline: issue.deadline,
            ad_title: issue.ad_title,
            other_party: issue.other_party_name
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
 * Get exchanges
 */
exports.getExchanges = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [exchanges] = await promisePool.query(
            `SELECT 
                d.id,
                d.dispute_number as reference,
                COALESCE(d.dispute_category, 'Exchange') as title,
                d.problem_description as description,
                d.status,
                d.created_at
            FROM disputes d
            WHERE d.user_id = ? AND d.dispute_type = 'exchange'
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        const formattedExchanges = exchanges.map(exchange => ({
            id: exchange.id,
            reference: exchange.reference,
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
 * Get ended cases
 */
exports.getEndedCases = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get ended issues
        const [endedIssues] = await promisePool.query(
            `SELECT 
                i.id,
                i.issue_number as reference,
                CONCAT(UPPER(SUBSTRING(i.issue_type, 1, 1)), SUBSTRING(i.issue_type, 2), ' Issue') as title,
                i.issue_description as description,
                i.status,
                i.accepted_at as ended_at,
                'issue' as type
            FROM issues i
            WHERE (i.created_by = ? OR i.other_party_id = ?)
            AND i.status IN ('accepted', 'escalated')
            ORDER BY i.accepted_at DESC
            LIMIT ?`,
            [userId, userId, parseInt(limit)]
        );

        // Get ended disputes
        const [endedDisputes] = await promisePool.query(
            `SELECT 
                d.id,
                d.dispute_number as reference,
                COALESCE(d.dispute_category, 'Dispute') as title,
                d.problem_description as description,
                d.status,
                d.closed_at as ended_at,
                'dispute' as type
            FROM disputes d
            WHERE d.user_id = ?
            AND d.status IN ('resolved', 'closed')
            ORDER BY d.closed_at DESC
            LIMIT ?`,
            [userId, parseInt(limit)]
        );

        // Combine and sort
        const allEnded = [...endedIssues, ...endedDisputes]
            .sort((a, b) => new Date(b.ended_at) - new Date(a.ended_at))
            .slice(0, parseInt(limit));

        const formattedEnded = allEnded.map(item => ({
            id: item.id,
            reference: item.reference,
            title: item.title,
            description: item.description,
            status: item.status,
            time: formatTimeAgo(item.ended_at),
            ended_at: item.ended_at,
            type: item.type
        }));

        res.json({
            success: true,
            data: formattedEnded
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

module.exports = exports;
