const { promisePool } = require('../../config/database');

/**
 * Issue Controller
 * Handles issue-related endpoints for mobile app
 */

/**
 * Create new issue
 */
exports.createIssue = async (req, res) => {
    try {
        console.log('=== CREATE ISSUE BACKEND ===');
        console.log('req.user:', req.user);
        console.log('req.body:', req.body);

        const {
            created_by,
            advertisement_id,
            other_party_id,
            issue_type,
            issue_description,
            buyer_request,
            product_name
        } = req.body;

        // Use created_by from body if auth failed, otherwise use authenticated user
        const userId = req.user?.id || created_by;

        if (!userId) {
            console.error('ERROR: No user ID - neither from auth nor from body');
            return res.status(401).json({
                success: false,
                message: 'User ID required'
            });
        }

        console.log('Using user ID:', userId);

        // Validation
        if (!advertisement_id || !other_party_id || !issue_description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Generate issue number
        const issueNumber = await generateIssueNumber();

        // Calculate deadline (3 days from now)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 3);

        const [result] = await promisePool.query(
            `INSERT INTO issues (
        issue_number,
        advertisement_id,
        product_name,
        created_by,
        other_party_id,
        issue_type,
        issue_description,
        buyer_request,
        deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                issueNumber,
                advertisement_id,
                product_name,
                userId,
                other_party_id,
                issue_type || 'other',
                issue_description,
                buyer_request,
                deadline
            ]
        );

        // Create system message
        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message)
       VALUES (?, ?, ?, TRUE)`,
            [result.insertId, userId, `Issue ${issueNumber} created. Seller has 3 days to respond.`]
        );

        res.json({
            success: true,
            data: {
                id: result.insertId,
                issue_number: issueNumber,
                deadline: deadline
            },
            message: 'Issue created successfully'
        });
    } catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create issue',
            error_code: 'CREATE_ERROR'
        });
    }
};

/**
 * Get user's issues
 */
exports.getUserIssues = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        i.*,
        a.title as ad_title,
        creator.full_name as creator_name,
        other.full_name as other_party_name
      FROM issues i
      LEFT JOIN advertisements a ON i.advertisement_id = a.id
      LEFT JOIN users creator ON i.created_by = creator.id
      LEFT JOIN users other ON i.other_party_id = other.id
      WHERE (i.created_by = ? OR i.other_party_id = ?)
    `;

        const params = [userId, userId];

        if (status) {
            query += ' AND i.status = ?';
            params.push(status);
        }

        query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [issues] = await promisePool.query(query, params);

        // Format response
        const formattedIssues = issues.map(issue => ({
            id: issue.id,
            issue_number: issue.issue_number,
            product_name: issue.product_name || issue.ad_title,
            issue_type: issue.issue_type,
            status: issue.status,
            created_by_me: issue.created_by === userId,
            other_party_name: issue.created_by === userId ? issue.other_party_name : issue.creator_name,
            created_at: issue.created_at,
            deadline: issue.deadline,
            responded_at: issue.responded_at
        }));

        res.json({
            success: true,
            data: formattedIssues
        });
    } catch (error) {
        console.error('Get user issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch issues'
        });
    }
};

/**
 * Get issue by ID
 */
exports.getIssueById = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;

        const [issues] = await promisePool.query(
            `SELECT 
        i.*,
        a.title as ad_title,
        creator.full_name as creator_name,
        creator.email as creator_email,
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
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        const issue = issues[0];

        // Format response
        const formattedIssue = {
            id: issue.id,
            issue_number: issue.issue_number,
            reference: issue.issue_number,
            product_name: issue.product_name || issue.ad_title,
            ad_title: issue.ad_title,
            issue_type: issue.issue_type,
            issue_description: issue.issue_description,
            description: issue.issue_description,
            buyer_request: issue.buyer_request,
            title: `${issue.issue_type.replace(/_/g, ' ')} Issue`,
            seller_response_text: issue.seller_response_text,
            seller_decision: issue.seller_decision,
            status: issue.status,
            deadline: issue.deadline,
            responded_at: issue.responded_at,
            closed_at: issue.closed_at,
            created_at: issue.created_at,
            created_by: issue.created_by,
            created_by_me: issue.created_by === userId,
            other_party_id: issue.other_party_id,
            other_party_name: issue.created_by === userId ? issue.other_party_name : issue.creator_name,
            other_party_user_id: issue.created_by === userId ? issue.other_party_id : issue.created_by
        };

        res.json({
            success: true,
            data: formattedIssue
        });
    } catch (error) {
        console.error('Get issue by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch issue details'
        });
    }
};

/**
 * Seller responds to issue
 */
exports.respondToIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;
        const { decision, response_text } = req.body;

        // Validation
        if (!decision || !response_text) {
            return res.status(400).json({
                success: false,
                message: 'Decision and response text are required'
            });
        }

        if (!['accept', 'decline'].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid decision. Must be "accept" or "decline"'
            });
        }

        // Verify user is the seller (other_party)
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND other_party_id = ? AND status = "open"',
            [issueId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized or issue already responded to'
            });
        }

        // Determine new status
        let newStatus = 'seller_responded';
        if (decision === 'accept') {
            newStatus = 'settled';
        }

        // Update issue with response
        await promisePool.query(
            `UPDATE issues SET
        seller_response_text = ?,
        seller_decision = ?,
        status = ?,
        responded_at = NOW()
      WHERE id = ?`,
            [response_text, decision, newStatus, issueId]
        );

        // Create system message
        const systemMessage = decision === 'accept'
            ? 'Seller accepted the issue. Issue is now settled.'
            : 'Seller declined the issue and provided a response.';

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message)
       VALUES (?, ?, ?, TRUE)`,
            [issueId, userId, systemMessage]
        );

        res.json({
            success: true,
            message: 'Response sent successfully',
            data: {
                status: newStatus
            }
        });
    } catch (error) {
        console.error('Respond to issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send response'
        });
    }
};

/**
 * Close issue (buyer only)
 */
exports.closeIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;

        // Verify user is the buyer (creator)
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND created_by = ?',
            [issueId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to close this issue'
            });
        }

        // Check if already closed or escalated
        if (['closed_by_buyer', 'escalated_to_dispute'].includes(issue[0].status)) {
            return res.status(400).json({
                success: false,
                message: 'Issue is already closed or escalated'
            });
        }

        await promisePool.query(
            `UPDATE issues SET
        status = 'closed_by_buyer',
        closed_at = NOW()
      WHERE id = ?`,
            [issueId]
        );

        // Create system message
        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message)
       VALUES (?, ?, ?, TRUE)`,
            [issueId, userId, 'Issue closed by buyer.']
        );

        res.json({
            success: true,
            message: 'Issue closed successfully'
        });
    } catch (error) {
        console.error('Close issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close issue'
        });
    }
};

/**
 * Escalate issue to dispute
 */
exports.escalateToDispute = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;

        // Get issue details
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND created_by = ?',
            [issueId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to escalate this issue'
            });
        }

        const issueData = issue[0];

        // Check if already escalated
        if (issueData.status === 'escalated_to_dispute') {
            return res.status(400).json({
                success: false,
                message: 'Issue is already escalated to dispute'
            });
        }

        // Generate dispute number
        const disputeNumber = await generateDisputeNumber();

        // Get advertisement owner (seller)
        const [adResult] = await promisePool.query(
            'SELECT user_id as seller_id FROM advertisements WHERE id = ?',
            [issueData.advertisement_id]
        );

        const sellerId = adResult.length > 0 ? adResult[0].seller_id : null;

        // Calculate dispute deadline (7 days)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        // Create dispute
        const [result] = await promisePool.query(
            `INSERT INTO disputes (
        dispute_number,
        user_id,
        seller_id,
        advertisement_id,
        issue_id,
        type,
        dispute_type,
        dispute_category,
        problem_description,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [
                disputeNumber,
                userId,
                sellerId,
                issueData.advertisement_id,
                issueId,
                'issue_escalation',
                'buyer_initiated',
                `Escalated from Issue #${issueData.issue_number}`,
                issueData.issue_description
            ]
        );

        // Update issue status
        await promisePool.query(
            `UPDATE issues SET
        status = 'escalated_to_dispute'
      WHERE id = ?`,
            [issueId]
        );

        // Create system message in issue
        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message)
       VALUES (?, ?, ?, TRUE)`,
            [issueId, userId, `Issue escalated to dispute ${disputeNumber}.`]
        );

        res.json({
            success: true,
            message: 'Issue escalated to dispute successfully',
            data: {
                dispute_id: result.insertId,
                dispute_number: disputeNumber
            }
        });
    } catch (error) {
        console.error('Escalate to dispute error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to escalate to dispute'
        });
    }
};

/**
 * Upload evidence
 */
exports.uploadEvidence = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Check file size (3MB = 3145728 bytes)
        if (file.size > 3145728) {
            return res.status(400).json({
                success: false,
                message: 'File size must be less than 3MB'
            });
        }

        // Verify user is part of the issue
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Determine file type
        const fileType = file.mimetype.includes('pdf') ? 'pdf' : 'image';

        // Save to database
        await promisePool.query(
            `INSERT INTO issue_evidence (
        issue_id,
        uploaded_by,
        file_path,
        file_name,
        file_type,
        file_size
      ) VALUES (?, ?, ?, ?, ?, ?)`,
            [issueId, userId, file.path, file.originalname, fileType, file.size]
        );

        res.json({
            success: true,
            message: 'Evidence uploaded successfully'
        });
    } catch (error) {
        console.error('Upload evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload evidence'
        });
    }
};

/**
 * Get evidence for issue
 */
exports.getEvidence = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;

        // Verify user is part of the issue
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Get evidence
        const [evidence] = await promisePool.query(
            `SELECT 
        e.*,
        u.full_name as uploader_name
      FROM issue_evidence e
      LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE e.issue_id = ?
      ORDER BY e.created_at DESC`,
            [issueId]
        );

        res.json({
            success: true,
            data: evidence
        });
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch evidence'
        });
    }
};

/**
 * Add message to issue
 */
exports.addMessage = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Verify user is part of the issue
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, sender_id, message)
       VALUES (?, ?, ?)`,
            [issueId, userId, message.trim()]
        );

        res.json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

/**
 * Get messages for issue
 */
exports.getMessages = async (req, res) => {
    try {
        const { issueId } = req.params;
        const userId = req.user.id;

        // Verify user is part of the issue
        const [issue] = await promisePool.query(
            'SELECT * FROM issues WHERE id = ? AND (created_by = ? OR other_party_id = ?)',
            [issueId, userId, userId]
        );

        if (issue.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Get messages
        const [messages] = await promisePool.query(
            `SELECT 
        m.*,
        u.full_name
      FROM issue_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.issue_id = ?
      ORDER BY m.created_at ASC`,
            [issueId]
        );

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function generateIssueNumber() {
    const [result] = await promisePool.query(
        'SELECT COUNT(*) as count FROM issues'
    );
    const count = result[0].count + 1;
    return `ISS${String(count).padStart(5, '0')}`;
}

async function generateDisputeNumber() {
    const [result] = await promisePool.query(
        'SELECT COUNT(*) as count FROM disputes'
    );
    const count = result[0].count + 1;
    return `DIS${String(count).padStart(5, '0')}`;
}

module.exports = exports;
