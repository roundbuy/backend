const { promisePool } = require('../../config/database');

class AdminSupportController {
    /**
     * Get all support tickets
     * GET /api/v1/admin/support/tickets
     */
    async getTickets(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category,
                priority,
                assigned_to,
                search,
                sort_by = 'created_at',
                sort_order = 'DESC',
            } = req.query;

            const offset = (page - 1) * limit;
            let whereConditions = [];
            let params = [];

            if (status) {
                whereConditions.push('t.status = ?');
                params.push(status);
            }

            if (category) {
                whereConditions.push('t.category = ?');
                params.push(category);
            }

            if (priority) {
                whereConditions.push('t.priority = ?');
                params.push(priority);
            }

            if (assigned_to) {
                whereConditions.push('t.assigned_to = ?');
                params.push(assigned_to);
            }

            if (search) {
                whereConditions.push(
                    '(t.ticket_number LIKE ? OR u.email LIKE ? OR t.subject LIKE ?)'
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
         FROM support_tickets t
         LEFT JOIN users u ON t.user_id = u.id
         ${whereClause}`,
                params
            );

            const total = countResult[0].total;

            // Get tickets
            const [tickets] = await promisePool.query(
                `SELECT 
          t.*,
          u.full_name as user_name,
          u.email as user_email,
          staff.full_name as assigned_to_name,
          COUNT(DISTINCT m.id) as message_count
         FROM support_tickets t
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN users staff ON t.assigned_to = staff.id
         LEFT JOIN support_messages m ON t.id = m.ticket_id
         ${whereClause}
         GROUP BY t.id
         ORDER BY t.${sort_by} ${sort_order}
         LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), offset]
            );

            res.json({
                success: true,
                data: tickets,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Get tickets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tickets',
                error: error.message,
            });
        }
    }

    /**
     * Get ticket details
     * GET /api/v1/admin/support/tickets/:id
     */
    async getTicketDetail(req, res) {
        try {
            const { id } = req.params;

            const [tickets] = await promisePool.query(
                `SELECT 
          t.*,
          u.full_name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.created_at as user_member_since,
          staff.full_name as assigned_to_name
         FROM support_tickets t
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN users staff ON t.assigned_to = staff.id
         WHERE t.id = ?`,
                [id]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found',
                });
            }

            // Get messages
            const [messages] = await promisePool.query(
                `SELECT 
          m.*,
          u.full_name as user_name,
          u.email as user_email
         FROM support_messages m
         LEFT JOIN users u ON m.user_id = u.id
         WHERE m.ticket_id = ?
         ORDER BY m.created_at ASC`,
                [id]
            );

            // Get user's total tickets
            const [userStats] = await promisePool.query(
                `SELECT COUNT(*) as total_tickets
         FROM support_tickets
         WHERE user_id = ?`,
                [tickets[0].user_id]
            );

            res.json({
                success: true,
                data: {
                    ...tickets[0],
                    messages,
                    user_total_tickets: userStats[0].total_tickets,
                },
            });
        } catch (error) {
            console.error('Get ticket detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch ticket details',
                error: error.message,
            });
        }
    }

    /**
     * Get ticket statistics
     * GET /api/v1/admin/support/tickets/stats
     */
    async getStats(req, res) {
        try {
            const [stats] = await promisePool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
        FROM support_tickets
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

    /**
     * Assign ticket to staff
     * PUT /api/v1/admin/support/tickets/:id/assign
     */
    async assignTicket(req, res) {
        try {
            const { id } = req.params;
            const { staff_id } = req.body;

            await promisePool.query(
                `UPDATE support_tickets 
         SET assigned_to = ?, updated_at = NOW()
         WHERE id = ?`,
                [staff_id, id]
            );

            // Add system message
            await promisePool.query(
                `INSERT INTO support_messages (ticket_id, user_id, message, is_staff_reply)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, `Ticket assigned to staff member`]
            );

            res.json({
                success: true,
                message: 'Ticket assigned successfully',
            });
        } catch (error) {
            console.error('Assign ticket error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign ticket',
                error: error.message,
            });
        }
    }

    /**
     * Update ticket priority
     * PUT /api/v1/admin/support/tickets/:id/priority
     */
    async updatePriority(req, res) {
        try {
            const { id } = req.params;
            const { priority } = req.body;

            if (!['low', 'medium', 'high'].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority value',
                });
            }

            await promisePool.query(
                `UPDATE support_tickets 
         SET priority = ?, updated_at = NOW()
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
     * Reply to ticket
     * POST /api/v1/admin/support/tickets/:id/reply
     */
    async replyToTicket(req, res) {
        try {
            const { id } = req.params;
            const { message } = req.body;

            if (!message || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required',
                });
            }

            await promisePool.query(
                `INSERT INTO support_messages (ticket_id, user_id, message, is_staff_reply)
         VALUES (?, ?, ?, TRUE)`,
                [id, req.user.userId, message.trim()]
            );

            await promisePool.query(
                `UPDATE support_tickets 
         SET status = 'pending', updated_at = NOW()
         WHERE id = ?`,
                [id]
            );

            res.json({
                success: true,
                message: 'Reply sent successfully',
            });
        } catch (error) {
            console.error('Reply error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send reply',
                error: error.message,
            });
        }
    }

    /**
     * Close ticket
     * PUT /api/v1/admin/support/tickets/:id/close
     */
    async closeTicket(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await promisePool.query(
                `UPDATE support_tickets 
         SET status = 'closed', closed_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
                [id]
            );

            if (reason) {
                await promisePool.query(
                    `INSERT INTO support_messages (ticket_id, user_id, message, is_staff_reply)
           VALUES (?, ?, ?, TRUE)`,
                    [id, req.user.userId, `Ticket closed. Reason: ${reason}`]
                );
            }

            res.json({
                success: true,
                message: 'Ticket closed successfully',
            });
        } catch (error) {
            console.error('Close ticket error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to close ticket',
                error: error.message,
            });
        }
    }

    /**
     * Add internal note
     * POST /api/v1/admin/support/tickets/:id/note
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
                `INSERT INTO support_messages (ticket_id, user_id, message, is_staff_reply, is_internal_note)
         VALUES (?, ?, ?, TRUE, TRUE)`,
                [id, req.user.userId, `Internal note: ${note.trim()}`]
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
}

module.exports = new AdminSupportController();
