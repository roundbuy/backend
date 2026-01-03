const { promisePool } = require('../../config/database');

class AdminDisputeController {
    /**
     * Get all disputes with filters
     * GET /api/v1/admin/disputes
     */
    async getDisputes(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                current_phase,
                priority,
                search,
                sort_by = 'created_at',
                sort_order = 'DESC',
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            if (status) {
                whereConditions.push('d.status = ?');
                params.push(status);
            }

            if (current_phase) {
                whereConditions.push('d.current_phase = ?');
                params.push(current_phase);
            }

            if (priority) {
                whereConditions.push('d.priority = ?');
                params.push(priority);
            }

            if (search) {
                whereConditions.push(
                    '(d.dispute_number LIKE ? OR u.email LIKE ? OR a.title LIKE ?)'
                );
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Get total count
            const [countResult] = await promisePool.query(
                `SELECT COUNT(*) as total 
         FROM disputes d
         LEFT JOIN users u ON d.user_id = u.id
         LEFT JOIN advertisements a ON d.advertisement_id = a.id
         ${whereClause}`,
                params
            );

            const total = countResult[0].total;

            // Get disputes
            const [disputes] = await promisePool.query(
                `SELECT 
          d.*,
          u.full_name as user_name,
          u.email as user_email,
          a.title as ad_title,
          a.price as ad_price,
          i.issue_number as linked_issue_number,
          COUNT(DISTINCT dm.id) as message_count,
          COUNT(DISTINCT de.id) as evidence_count
         FROM disputes d
         LEFT JOIN users u ON d.user_id = u.id
         LEFT JOIN advertisements a ON d.advertisement_id = a.id
         LEFT JOIN issues i ON d.issue_id = i.id
         LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id
         LEFT JOIN dispute_evidence de ON d.id = de.dispute_id
         ${whereClause}
         GROUP BY d.id
         ORDER BY d.${sort_by} ${sort_order}
         LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            res.json({
                success: true,
                data: disputes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Get disputes error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch disputes',
                error: error.message,
            });
        }
    }

    /**
     * Get dispute details
     * GET /api/v1/admin/disputes/:id
     */
    async getDisputeDetail(req, res) {
        try {
            const { id } = req.params;

            const [disputes] = await promisePool.query(
                `SELECT 
          d.*,
          u.full_name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          a.title as ad_title,
          a.price as ad_price,
          a.description as ad_description,
          i.issue_number as linked_issue_number,
          i.issue_type as linked_issue_type
         FROM disputes d
         LEFT JOIN users u ON d.user_id = u.id
         LEFT JOIN advertisements a ON d.advertisement_id = a.id
         LEFT JOIN issues i ON d.issue_id = i.id
         WHERE d.id = ?`,
                [id]
            );

            if (disputes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Dispute not found',
                });
            }

            // Get messages
            const [messages] = await promisePool.query(
                `SELECT 
          dm.*,
          u.full_name as user_name,
          u.email as user_email
         FROM dispute_messages dm
         LEFT JOIN users u ON dm.user_id = u.id
         WHERE dm.dispute_id = ?
         ORDER BY dm.created_at ASC`,
                [id]
            );

            // Get evidence
            const [evidence] = await promisePool.query(
                `SELECT 
          de.*,
          u.full_name as uploaded_by_name
         FROM dispute_evidence de
         LEFT JOIN users u ON de.uploaded_by = u.id
         WHERE de.dispute_id = ?
         ORDER BY de.uploaded_at DESC`,
                [id]
            );

            res.json({
                success: true,
                data: {
                    ...disputes[0],
                    messages,
                    evidence,
                },
            });
        } catch (error) {
            console.error('Get dispute detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dispute details',
                error: error.message,
            });
        }
    }

    /**
     * Assign dispute to staff
     * PUT /api/v1/admin/disputes/:id/assign
     */
    async assignDispute(req, res) {
        try {
            const { id } = req.params;
            const { staff_id } = req.body;

            await promisePool.query(
                `UPDATE disputes 
         SET assigned_to = ?
         WHERE id = ?`,
                [staff_id, id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'status_update')`,
                [id, req.user.userId, `Dispute assigned to staff member`]
            );

            res.json({
                success: true,
                message: 'Dispute assigned successfully',
            });
        } catch (error) {
            console.error('Assign dispute error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign dispute',
                error: error.message,
            });
        }
    }

    /**
     * Update dispute priority
     * PUT /api/v1/admin/disputes/:id/priority
     */
    async updatePriority(req, res) {
        try {
            const { id } = req.params;
            const { priority } = req.body;

            if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority value',
                });
            }

            await promisePool.query(
                `UPDATE disputes 
         SET priority = ?
         WHERE id = ?`,
                [priority, id]
            );

            res.json({
                success: true,
                message: 'Priority updated successfully',
            });
        } catch (error) {
            console.error('Update priority error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update priority',
                error: error.message,
            });
        }
    }

    /**
     * Extend dispute deadline
     * PUT /api/v1/admin/disputes/:id/extend-deadline
     */
    async extendDeadline(req, res) {
        try {
            const { id } = req.params;
            const { days, deadline_type } = req.body;

            if (!days || days < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Days must be at least 1',
                });
            }

            const validTypes = ['dispute_deadline', 'claim_deadline', 'resolution_deadline'];
            if (!validTypes.includes(deadline_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid deadline type',
                });
            }

            await promisePool.query(
                `UPDATE disputes 
         SET ${deadline_type} = DATE_ADD(${deadline_type}, INTERVAL ? DAY)
         WHERE id = ?`,
                [days, id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'status_update')`,
                [id, req.user.userId, `Admin extended ${deadline_type.replace('_', ' ')} by ${days} day(s)`]
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
     * Resolve dispute
     * POST /api/v1/admin/disputes/:id/resolve
     */
    async resolveDispute(req, res) {
        try {
            const { id } = req.params;
            const { resolution, winner } = req.body;

            if (!resolution || !resolution.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Resolution is required',
                });
            }

            await promisePool.query(
                `UPDATE disputes 
         SET status = 'resolved', 
             resolution_status = 'ended',
             current_phase = 'ended',
             closed_at = NOW()
         WHERE id = ?`,
                [id]
            );

            // Add resolution message
            await promisePool.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'resolution')`,
                [id, req.user.userId, `Admin resolved dispute. Resolution: ${resolution}. Winner: ${winner || 'N/A'}`]
            );

            res.json({
                success: true,
                message: 'Dispute resolved successfully',
            });
        } catch (error) {
            console.error('Resolve dispute error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resolve dispute',
                error: error.message,
            });
        }
    }

    /**
     * Close dispute
     * PUT /api/v1/admin/disputes/:id/close
     */
    async closeDispute(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await promisePool.query(
                `UPDATE disputes 
         SET status = 'closed',
             current_phase = 'ended',
             closed_at = NOW()
         WHERE id = ?`,
                [id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'status_update')`,
                [id, req.user.userId, `Admin closed dispute. Reason: ${reason || 'N/A'}`]
            );

            res.json({
                success: true,
                message: 'Dispute closed successfully',
            });
        } catch (error) {
            console.error('Close dispute error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to close dispute',
                error: error.message,
            });
        }
    }

    /**
     * Add admin note
     * POST /api/v1/admin/disputes/:id/note
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
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'admin_note')`,
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
     * Get dispute statistics
     * GET /api/v1/admin/disputes/stats
     */
    async getStats(req, res) {
        try {
            const [stats] = await promisePool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN current_phase = 'dispute' THEN 1 ELSE 0 END) as in_dispute_phase,
          SUM(CASE WHEN current_phase = 'claim' THEN 1 ELSE 0 END) as in_claim_phase,
          SUM(CASE WHEN current_phase = 'resolution' THEN 1 ELSE 0 END) as in_resolution_phase,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
          SUM(CASE WHEN dispute_deadline < NOW() AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as overdue
        FROM disputes
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

module.exports = new AdminDisputeController();
