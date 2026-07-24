const { promisePool: db } = require('../../config/database');

/**
 * Helper to check if user is eligible for KYC / KYB verification
 */
async function isEligibleForKYC(userId) {
    try {
        const [users] = await db.query(
            `SELECT u.user_type, u.cumulative_earnings, sp.slug as subscription_plan_slug
             FROM users u
             LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) return false;
        const user = users[0];

        const isBusiness = user.user_type === 'business' || 
                           (user.subscription_plan_slug && 
                            (user.subscription_plan_slug.toLowerCase().includes('business') || 
                             user.subscription_plan_slug.toLowerCase().includes('pro')));
        const hasReachedLimit = parseFloat(user.cumulative_earnings || 0) >= 1000;

        return isBusiness || hasReachedLimit;
    } catch (error) {
        console.error('Error in isEligibleForKYC helper:', error);
        return false;
    }
}

/**
 * Get required document types for a given country
 */
exports.getDocumentTypes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { country_code } = req.query;
        if (!country_code) {
            return res.status(400).json({ success: false, message: 'country_code query parameter is required' });
        }

        const eligible = await isEligibleForKYC(userId);
        if (!eligible) {
            return res.status(403).json({ success: false, message: 'KYC/KYB is not required or accessible for this account yet.' });
        }

        const [rows] = await db.query(
            `SELECT * FROM kyc_document_types WHERE country_code = ?`,
            [country_code.toUpperCase()]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching document types:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Submit KYC/KYB documents
 */
exports.submitKyc = async (req, res) => {
    try {
        const userId = req.user.id;
        const { country_code, document_type, business_name, business_reg_number } = req.body;

        if (!country_code || !document_type) {
            return res.status(400).json({ success: false, message: 'country_code and document_type are required' });
        }

        const eligible = await isEligibleForKYC(userId);
        if (!eligible) {
            return res.status(403).json({ success: false, message: 'KYC/KYB is not required or accessible for this account yet.' });
        }

        const files = req.files || {};
        const frontDoc = files['front_document'] ? `/uploads/kyc/${files['front_document'][0].filename}` : null;
        const backDoc = files['back_document'] ? `/uploads/kyc/${files['back_document'][0].filename}` : null;
        const selfie = files['selfie'] ? `/uploads/kyc/${files['selfie'][0].filename}` : null;
        const bizReg = files['business_reg'] ? `/uploads/kyc/${files['business_reg'][0].filename}` : null;

        if (!frontDoc && !bizReg) {
            return res.status(400).json({ success: false, message: 'Please upload at least the primary document.' });
        }

        // Check if existing record
        const [existing] = await db.query(`SELECT id FROM kyc_records WHERE user_id = ?`, [userId]);

        if (existing.length > 0) {
            // Update
            await db.query(`
                UPDATE kyc_records 
                SET country_code = ?, document_type = ?, 
                    front_document_url = COALESCE(?, front_document_url),
                    back_document_url = COALESCE(?, back_document_url),
                    selfie_url = COALESCE(?, selfie_url),
                    business_name = ?, business_reg_number = ?,
                    business_reg_document_url = COALESCE(?, business_reg_document_url),
                    status = 'pending',
                    updated_at = NOW()
                WHERE user_id = ?
            `, [
                country_code, document_type, 
                frontDoc, backDoc, selfie, 
                business_name || null, business_reg_number || null, bizReg,
                userId
            ]);
        } else {
            // Insert
            await db.query(`
                INSERT INTO kyc_records (
                    user_id, status, country_code, document_type,
                    front_document_url, back_document_url, selfie_url,
                    business_name, business_reg_number, business_reg_document_url
                ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, country_code, document_type,
                frontDoc, backDoc, selfie,
                business_name || null, business_reg_number || null, bizReg
            ]);
        }

        // Update user status
        await db.query(`UPDATE users SET kyc_status = 'pending' WHERE id = ?`, [userId]);

        res.json({ success: true, message: 'KYC documents submitted successfully' });
    } catch (error) {
        console.error('Error submitting KYC:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get current KYC status for the logged-in user
 */
exports.getKycStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const eligible = await isEligibleForKYC(userId);
        if (!eligible) {
            return res.json({ success: true, data: { status: 'not_required' } });
        }

        const [rows] = await db.query(`
            SELECT id, status, country_code, document_type, rejection_reason, reviewer_notes, created_at, updated_at
            FROM kyc_records WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
        `, [userId]);

        if (rows.length === 0) {
            return res.json({ success: true, data: { status: 'upload' } });
        }

        const row = rows[0];
        // Normalise DB status to frontend states
        const statusMap = { not_started: 'upload', pending: 'pending', verified: 'approved', rejected: 'rejected', more_info: 'more_info' };
        const status = statusMap[row.status] || 'upload';
        const message = row.rejection_reason || row.reviewer_notes || '';

        res.json({ success: true, data: { status, message, created_at: row.created_at, updated_at: row.updated_at } });
    } catch (error) {
        console.error('Error getting KYC status:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
