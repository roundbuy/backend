const { promisePool } = require('../../config/database');

class AdminIssueController {
    /**
     * Get all issues with filters
     * GET /api/v1/admin/issues
     */
    async getIssues(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                issue_type,
                search,
                sort_by = 'created_at',
                sort_order = 'DESC',
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            // Filter by status
            if (status) {
                whereConditions.push('i.status = ?');
                params.push(status);
            }

            // Filter by issue type
            if (issue_type) {
                whereConditions.push('i.issue_type = ?');
                params.push(issue_type);
            }

            // Search by issue number, user email, or ad title
            if (search) {
                whereConditions.push(
                    '(i.issue_number LIKE ? OR creator.email LIKE ? OR other.email LIKE ? OR a.title LIKE ?)'
                );
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Get total count
            const [countResult] = await promisePool.query(
                `SELECT COUNT(*) as total 
         FROM issues i
         LEFT JOIN users creator ON i.created_by = creator.id
         LEFT JOIN users other ON i.other_party_id = other.id
         LEFT JOIN advertisements a ON i.advertisement_id = a.id
         ${whereClause}`,
                params
            );

            const total = countResult[0].total;

            // Get issues
            const [issues] = await promisePool.query(
                `SELECT 
          i.*,
          creator.full_name as creator_name,
          creator.email as creator_email,
          other.full_name as other_party_name,
          other.email as other_party_email,
          a.title as ad_title,
          a.price as ad_price,
          COUNT(DISTINCT im.id) as message_count
         FROM issues i
         LEFT JOIN users creator ON i.created_by = creator.id
         LEFT JOIN users other ON i.other_party_id = other.id
         LEFT JOIN advertisements a ON i.advertisement_id = a.id
         LEFT JOIN issue_messages im ON i.id = im.issue_id
         ${whereClause}
         GROUP BY i.id
         ORDER BY i.${sort_by} ${sort_order}
         LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            res.json({
                success: true,
                data: issues,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Get issues error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch issues',
                error: error.message,
            });
        }
    }

    /**
     * Get issue details
     * GET /api/v1/admin/issues/:id
     */
    async getIssueDetail(req, res) {
        try {
            const { id } = req.params;

            const [issues] = await promisePool.query(
                `SELECT 
          i.*,
          creator.full_name as creator_name,
          creator.email as creator_email,
          creator.phone as creator_phone,
          other.full_name as other_party_name,
          other.email as other_party_email,
          other.phone as other_party_phone,
          a.title as ad_title,
          a.price as ad_price,
          a.description as ad_description
         FROM issues i
         LEFT JOIN users creator ON i.created_by = creator.id
         LEFT JOIN users other ON i.other_party_id = other.id
         LEFT JOIN advertisements a ON i.advertisement_id = a.id
         WHERE i.id = ?`,
                [id]
            );

            if (issues.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Issue not found',
                });
            }

            // Get messages
            const [messages] = await promisePool.query(
                `SELECT 
          im.*,
          u.full_name as user_name,
          u.email as user_email
         FROM issue_messages im
         LEFT JOIN users u ON im.user_id = u.id
         WHERE im.issue_id = ?
         ORDER BY im.created_at ASC`,
                [id]
            );

            res.json({
                success: true,
                data: {
                    ...issues[0],
                    messages,
                },
            });
        } catch (error) {
            console.error('Get issue detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch issue details',
                error: error.message,
            });
        }
    }

    /**
     * Extend issue deadline
     * PUT /api/v1/admin/issues/:id/extend-deadline
     */
    async extendDeadline(req, res) {
        try {
            const { id } = req.params;
            const { days } = req.body;

            if (!days || days < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Days must be at least 1',
                });
            }

            const [result] = await promisePool.query(
                `UPDATE issues 
         SET issue_deadline = DATE_ADD(issue_deadline, INTERVAL ? DAY)
         WHERE id = ?`,
                [days, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Issue not found',
                });
            }

            // Add system message
            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Admin extended deadline by ${days} day(s)`]
            );

            res.json({
                success: true,
                message: 'Deadline extended successfully',
            });
        } catch (error) {
            console.error('Extend deadline error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to extend deadline',
                error: error.message,
            });
        }
    }

    /**
     * Force accept issue
     * PUT /api/v1/admin/issues/:id/force-accept
     */
    async forceAccept(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await promisePool.query(
                `UPDATE issues 
         SET status = 'accepted', accepted_at = NOW()
         WHERE id = ?`,
                [id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Admin force-accepted issue. Reason: ${reason || 'N/A'}`]
            );

            res.json({
                success: true,
                message: 'Issue force-accepted successfully',
            });
        } catch (error) {
            console.error('Force accept error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to force accept issue',
                error: error.message,
            });
        }
    }

    /**
     * Force reject issue
     * PUT /api/v1/admin/issues/:id/force-reject
     */
    async forceReject(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await promisePool.query(
                `UPDATE issues 
         SET status = 'rejected', rejected_at = NOW()
         WHERE id = ?`,
                [id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Admin force-rejected issue. Reason: ${reason || 'N/A'}`]
            );

            res.json({
                success: true,
                message: 'Issue force-rejected successfully',
            });
        } catch (error) {
            console.error('Force reject error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to force reject issue',
                error: error.message,
            });
        }
    }

    /**
     * Close issue
     * PUT /api/v1/admin/issues/:id/close
     */
    async closeIssue(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await promisePool.query(
                `UPDATE issues 
         SET status = 'closed'
         WHERE id = ?`,
                [id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Admin closed issue. Reason: ${reason || 'N/A'}`]
            );

            res.json({
                success: true,
                message: 'Issue closed successfully',
            });
        } catch (error) {
            console.error('Close issue error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to close issue',
                error: error.message,
            });
        }
    }

    /**
     * Add admin note
     * POST /api/v1/admin/issues/:id/note
     */
    async addNote(req, res) {
        try {
            const { id } = req.params;
            const { note } = req.body;

            if (!note || !note.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Note is required',
                });
            }

            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Admin note: ${note}`]
            );

            res.json({
                success: true,
                message: 'Note added successfully',
            });
        } catch (error) {
            console.error('Add note error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add note',
                error: error.message,
            });
        }
    }

    /**
     * Get issue statistics
     * GET /api/v1/admin/issues/stats
     */
    async getStats(req, res) {
        try {
            const [stats] = await promisePool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN issue_deadline < NOW() AND status = 'pending' THEN 1 ELSE 0 END) as overdue
        FROM issues
      `);

            res.json({
                success: true,
                data: stats[0],
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics',
                error: error.message,
            });
        }
    }
}

module.exports = new AdminIssueController();
