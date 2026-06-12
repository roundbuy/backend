const { promisePool: db } = require('../../config/database');

/**
 * Get required document types for a given country
 */
exports.getDocumentTypes = async (req, res) => {
    try {
        const { country_code } = req.query;
        if (!country_code) {
            return res.status(400).json({ success: false, message: 'country_code query parameter is required' });
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
        const [rows] = await db.query(`
            SELECT id, status, country_code, document_type, rejection_reason, created_at, updated_at
            FROM kyc_records WHERE user_id = ?
        `, [userId]);

        if (rows.length === 0) {
            return res.json({ success: true, data: { status: 'unverified' } });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error getting KYC status:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
