const { promisePool } = require('../config/database');

class IssueService {
    /**
     * Generate unique issue number
     */
    async generateIssueNumber() {
        const [rows] = await promisePool.query(
            'SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number, 4) AS UNSIGNED)), 0) + 1 as next_num FROM issues'
        );
        const nextNum = rows[0].next_num;
        return `ISS${String(nextNum).padStart(8, '0')}`;
    }

    /**
     * Calculate issue deadline (3 days at 00:00 UK time)
     */
    calculateIssueDeadline() {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 3);
        deadline.setHours(0, 0, 0, 0);
        return deadline;
    }

    /**
     * Create a new issue
     */
    async createIssue(data) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            console.log('=== ISSUE SERVICE CREATE ===');
            console.log('Data received:', data);

            const issueNumber = await this.generateIssueNumber();
            const deadline = this.calculateIssueDeadline();

            console.log('Issue number:', issueNumber);
            console.log('Deadline:', deadline);

            const [result] = await connection.query(
                `INSERT INTO issues (
          issue_number, created_by, other_party_id, advertisement_id,
          issue_type, issue_description, buyer_request, product_name, deadline, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
                [
                    issueNumber,
                    data.created_by,
                    data.other_party_id,
                    data.advertisement_id,
                    data.issue_type || 'other',
                    data.issue_description,
                    data.buyer_request || null,
                    data.product_name || null,
                    deadline
                ]
            );

            const issueId = result.insertId;
            console.log('Issue created with ID:', issueId);

            // Add initial system message
            await connection.query(
                `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
                [
                    issueId,
                    data.created_by,
                    `Issue ${issueNumber} created. The seller has 3 days to respond.`
                ]
            );

            await connection.commit();

            return {
                success: true,
                data: {
                    id: issueId,
                    issue_number: issueNumber,
                    deadline: deadline
                },
                message: 'Issue created successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Issue service create error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get user's issues
     */
    async getUserIssues(userId, filters = {}) {
        let query = `
      SELECT 
        i.*,
        a.title as ad_title,
        a.price as ad_price,
        creator.full_name as created_by_name,
        other.full_name as other_party_name,
        COUNT(DISTINCT im.id) as message_count
      FROM issues i
      LEFT JOIN advertisements a ON i.advertisement_id = a.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users other ON i.other_party_id = other.id
      LEFT JOIN issue_messages im ON i.id = im.issue_id
      WHERE (i.created_by = ? OR i.other_party_id = ?)
    `;

        const params = [userId, userId];

        if (filters.status) {
            query += ` AND i.status = ?`;
            params.push(filters.status);
        }

        if (filters.issue_type) {
            query += ` AND i.issue_type = ?`;
            params.push(filters.issue_type);
        }

        query += ` GROUP BY i.id ORDER BY i.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        const [issues] = await promisePool.query(query, params);
        return issues;
    }

    /**
     * Get issue by ID
     */
    async getIssueById(issueId, userId) {
        const [issues] = await promisePool.query(
            `SELECT 
        i.*,
        a.id as ad_id,
        a.title as ad_title,
        a.description as ad_description,
        a.price as ad_price,
        a.image_url as ad_image,
        creator.id as creator_id,
        creator.full_name as creator_name,
        creator.email as creator_email,
        other.id as other_party_user_id,
        other.full_name as other_party_name,
        other.email as other_party_email
      FROM issues i
      LEFT JOIN advertisements a ON i.advertisement_id = a.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users other ON i.other_party_id = other.id
      WHERE i.id = ? AND (i.created_by = ? OR i.other_party_id = ?)`,
            [issueId, userId, userId]
        );

        if (issues.length === 0) {
            return null;
        }

        return issues[0];
    }

    /**
     * Get issue by issue number
     */
    async getIssueByNumber(issueNumber, userId) {
        const [issues] = await promisePool.query(
            `SELECT 
        i.*,
        a.id as ad_id,
        a.title as ad_title,
        a.description as ad_description,
        a.price as ad_price,
        a.image_url as ad_image
      FROM issues i
      LEFT JOIN advertisements a ON i.advertisement_id = a.id
      WHERE i.issue_number = ? AND (i.created_by = ? OR i.other_party_id = ?)`,
            [issueNumber, userId, userId]
        );

        if (issues.length === 0) {
            return null;
        }

        return issues[0];
    }

    /**
     * Accept an issue
     */
    async acceptIssue(issueId, userId) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify user is the other party
            const [issues] = await connection.query(
                'SELECT * FROM issues WHERE id = ? AND other_party_id = ? AND status = ?',
                [issueId, userId, 'pending']
            );

            if (issues.length === 0) {
                throw new Error('Issue not found or you are not authorized to accept it');
            }

            const issue = issues[0];

            // Update issue status
            await connection.query(
                `UPDATE issues 
        SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
        WHERE id = ?`,
                [issueId]
            );

            // Add system message
            await connection.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
                [issueId, userId, 'Issue accepted. Case resolved.']
            );

            await connection.commit();

            return {
                success: true,
                message: 'Issue accepted successfully',
                issue_id: issueId
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Reject an issue (escalates to dispute)
     */
    async rejectIssue(issueId, userId, rejectionReason = null) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify user is the other party
            const [issues] = await connection.query(
                'SELECT * FROM issues WHERE id = ? AND other_party_id = ? AND status = ?',
                [issueId, userId, 'pending']
            );

            if (issues.length === 0) {
                throw new Error('Issue not found or you are not authorized to reject it');
            }

            const issue = issues[0];

            // Update issue status
            await connection.query(
                `UPDATE issues 
        SET status = 'rejected', rejected_at = NOW(), updated_at = NOW()
        WHERE id = ?`,
                [issueId]
            );

            // Add system message
            const message = rejectionReason
                ? `Issue rejected. Reason: ${rejectionReason}. Escalating to dispute...`
                : 'Issue rejected. Escalating to dispute...';

            await connection.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
                [issueId, userId, message]
            );

            // Auto-escalate to dispute
            const disputeId = await this.escalateToDispute(issue, connection);

            await connection.commit();

            return {
                success: true,
                message: 'Issue rejected and escalated to dispute',
                issue_id: issueId,
                dispute_id: disputeId
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Escalate issue to dispute
     */
    async escalateToDispute(issue, connection = null) {
        const shouldReleaseConnection = !connection;
        if (!connection) {
            connection = await promisePool.getConnection();
            await connection.beginTransaction();
        }

        try {
            // Generate dispute number
            const [rows] = await connection.query(
                'SELECT COALESCE(MAX(CAST(SUBSTRING(dispute_number, 5) AS UNSIGNED)), 0) + 1 as next_num FROM disputes'
            );
            const disputeNumber = `DIS${String(rows[0].next_num).padStart(8, '0')}`;

            // Calculate dispute deadline (20 days)
            const disputeDeadline = new Date();
            disputeDeadline.setDate(disputeDeadline.getDate() + 20);
            disputeDeadline.setHours(0, 0, 0, 0);

            // Create dispute
            const [result] = await connection.query(
                `INSERT INTO disputes (
          dispute_number, user_id, advertisement_id, issue_id,
          dispute_type, dispute_category, problem_description,
          status, current_phase, priority, dispute_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'dispute', 'medium', ?)`,
                [
                    disputeNumber,
                    issue.created_by,
                    issue.advertisement_id,
                    issue.id,
                    'issue_negotiation',
                    issue.issue_type,
                    issue.issue_description,
                    disputeDeadline
                ]
            );

            const disputeId = result.insertId;

            // Update issue with dispute ID
            await connection.query(
                `UPDATE issues 
        SET status = 'escalated', escalated_dispute_id = ?, escalated_at = NOW()
        WHERE id = ?`,
                [disputeId, issue.id]
            );

            // Add initial dispute message
            await connection.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
        VALUES (?, ?, ?, TRUE, 'status_update')`,
                [
                    disputeId,
                    issue.created_by,
                    `Dispute created from rejected issue ${issue.issue_number}. Both parties have 20 days to provide evidence and responses.`
                ]
            );

            if (shouldReleaseConnection) {
                await connection.commit();
                connection.release();
            }

            return disputeId;
        } catch (error) {
            if (shouldReleaseConnection) {
                await connection.rollback();
                connection.release();
            }
            throw error;
        }
    }

    /**
     * Add message to issue
     */
    async addIssueMessage(issueId, userId, message) {
        // Verify user has access to this issue
        const [issues] = await promisePool.query(
            'SELECT id FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issues.length === 0) {
            throw new Error('Issue not found or access denied');
        }

        const [result] = await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message)
      VALUES (?, ?, ?)`,
            [issueId, userId, message]
        );

        // Update issue's updated_at
        await promisePool.query(
            'UPDATE issues SET updated_at = NOW() WHERE id = ?',
            [issueId]
        );

        return {
            id: result.insertId,
            issue_id: issueId,
            user_id: userId,
            message,
            created_at: new Date()
        };
    }

    /**
     * Get issue messages
     */
    async getIssueMessages(issueId, userId) {
        // Verify user has access to this issue
        const [issues] = await promisePool.query(
            'SELECT id FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issues.length === 0) {
            throw new Error('Issue not found or access denied');
        }

        const [messages] = await promisePool.query(
            `SELECT 
        im.*,
        u.full_name,
        u.email
      FROM issue_messages im
      LEFT JOIN users u ON im.user_id = u.id
      WHERE im.issue_id = ?
      ORDER BY im.created_at ASC`,
            [issueId]
        );

        return messages;
    }

    /**
     * Check if issue deadline has passed
     */
    isDeadlinePassed(deadline) {
        return new Date() > new Date(deadline);
    }

    /**
     * Get time remaining until deadline
     */
    getTimeRemaining(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;

        if (diff < 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} remaining`;
        } else {
            return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
        }
    }

    /**
     * Get issue statistics for user
     */
    async getIssueStats(userId) {
        const [stats] = await promisePool.query(
            `SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM issues
      WHERE created_by = ? OR other_party_id = ?`,
            [userId, userId]
        );

        return stats[0];
    }
}

module.exports = new IssueService();
