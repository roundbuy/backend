const { promisePool: db } = require('../../config/database');
const notificationService = require('../../services/notification.service');
const notificationDispatcher = require('../../services/notificationDispatcher.service');

/**
 * Get all KYC/KYB submissions
 */
exports.getAllSubmissions = async (req, res) => {
    try {
        const { status, type, country_code, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT k.*, u.full_name, u.email 
            FROM kyc_records k 
            JOIN users u ON k.user_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND k.status = ?`;
            params.push(status);
        }
        if (country_code) {
            query += ` AND k.country_code = ?`;
            params.push(country_code);
        }

        query += ` ORDER BY k.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(query, params);

        // Count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM kyc_records k WHERE 1=1`;
        const countParams = [];
        if (status) { countQuery += ` AND status = ?`; countParams.push(status); }
        if (country_code) { countQuery += ` AND country_code = ?`; countParams.push(country_code); }
        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching KYC submissions:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get a single KYC submission detail
 */
exports.getSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT k.*, u.full_name, u.email 
            FROM kyc_records k 
            JOIN users u ON k.user_id = u.id 
            WHERE k.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching KYC submission:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Approve or Reject KYC/KYB
 */
exports.reviewSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        const adminId = req.user.id;

        if (!['approved', 'verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (status === 'rejected' && !rejection_reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        const [kyc] = await db.query(`SELECT user_id FROM kyc_records WHERE id = ?`, [id]);
        if (kyc.length === 0) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        const userId = kyc[0].user_id;
        const dbStatus = (status === 'approved' || status === 'verified') ? 'verified' : status;

        await db.query(`
            UPDATE kyc_records 
            SET status = ?, rejection_reason = ?, updated_at = NOW() 
            WHERE id = ?
        `, [dbStatus, status === 'rejected' ? rejection_reason : null, id]);

        if (status === 'approved' || status === 'verified') {
            await db.query(`UPDATE users SET kyc_status = 'verified', kyc_completed = 1, kyc_required = 0 WHERE id = ?`, [userId]);
        } else {
            await db.query(`UPDATE users SET kyc_status = 'rejected', kyc_completed = 0, kyc_required = 1 WHERE id = ?`, [userId]);
        }

        // Log admin activity
        try {
            await db.query(`
                INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, new_value)
                VALUES (?, ?, 'kyc_record', ?, ?)
            `, [adminId, `KYC_${dbStatus.toUpperCase()}`, id, JSON.stringify({ reason: rejection_reason })]);
        } catch (logErr) {
            console.error('Failed to log admin activity:', logErr);
        }

        // Send notification to user
        try {
            const notifTitle = (status === 'approved' || status === 'verified') ? 'KYC Verification Approved' : 'KYC Verification Rejected';
            const notifMessage = (status === 'approved' || status === 'verified') 
                ? 'Congratulations! Your identity verification has been approved.' 
                : `Your identity verification was rejected. Reason: ${rejection_reason}`;
            
            const notifId = await notificationService.createNotification({
                title: notifTitle,
                message: notifMessage,
                type: 'push',
                targetAudience: 'specific',
                targetUserIds: [userId],
                createdBy: adminId
            });
            await notificationDispatcher.dispatchNotification(notifId);
        } catch (notifErr) {
            console.error('Failed to send KYC notification:', notifErr);
        }

        res.json({ success: true, message: `KYC submission ${dbStatus}` });
    } catch (error) {
        console.error('Error reviewing KYC submission:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
