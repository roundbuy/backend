const { promisePool } = require('../config/database');

class ClaimService {
    /**
     * Generate unique claim number
     */
    async generateClaimNumber() {
        const [result] = await promisePool.query(
            'SELECT claim_number FROM claims ORDER BY id DESC LIMIT 1'
        );

        if (result.length === 0) {
            return 'CLM00001';
        }

        const lastNumber = result[0].claim_number;
        const numberPart = parseInt(lastNumber.replace('CLM', ''));
        const newNumber = numberPart + 1;
        return `CLM${String(newNumber).padStart(5, '0')}`;
    }

    /**
     * Create new claim from dispute
     */
    async createClaim(disputeId, userId, claimData) {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            // Get dispute details
            const [disputes] = await connection.query(
                `SELECT d.*, a.id as ad_id, a.title as ad_title
         FROM disputes d
         LEFT JOIN advertisements a ON d.advertisement_id = a.id
         WHERE d.id = ? AND (d.user_id = ? OR d.seller_id = ?)`,
                [disputeId, userId, userId]
            );

            if (disputes.length === 0) {
                throw new Error('Dispute not found or access denied');
            }

            const dispute = disputes[0];

            // Verify user is the buyer (claimant)
            if (dispute.user_id !== userId) {
                throw new Error('Only the buyer can create a claim');
            }

            // Verify dispute status allows escalation
            if (dispute.status === 'escalated') {
                throw new Error('Dispute already escalated to claim');
            }

            // Generate claim number
            const claimNumber = await this.generateClaimNumber();

            // Create claim
            const [result] = await connection.query(
                `INSERT INTO claims (
          claim_number,
          dispute_id,
          user_id,
          seller_id,
          advertisement_id,
          claim_reason,
          buyer_additional_evidence,
          status,
          priority,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
                [
                    claimNumber,
                    disputeId,
                    dispute.user_id,
                    dispute.seller_id,
                    dispute.advertisement_id,
                    claimData.claim_reason,
                    claimData.additional_evidence || null,
                    claimData.priority || 'medium'
                ]
            );

            const claimId = result.insertId;

            // Update dispute status
            await connection.query(
                `UPDATE disputes SET status = 'escalated', current_phase = 'claim', updated_at = NOW() WHERE id = ?`,
                [disputeId]
            );

            // Add system message to claim
            await connection.query(
                `INSERT INTO claim_messages (claim_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'status_update')`,
                [claimId, userId, `Claim ${claimNumber} created. Awaiting admin review.`]
            );

            // Add system message to dispute
            await connection.query(
                `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
         VALUES (?, ?, ?, TRUE, 'status_update')`,
                [disputeId, userId, `Dispute escalated to Claim ${claimNumber}`]
            );

            await connection.commit();

            return {
                id: claimId,
                claim_number: claimNumber,
                dispute_id: disputeId,
                status: 'pending'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get user's claims
     */
    async getUserClaims(userId, filters = {}) {
        let query = `
      SELECT 
        c.*,
        a.title as ad_title,
        a.price as ad_price,
        buyer.full_name as buyer_name,
        seller.full_name as seller_name,
        admin.full_name as admin_name,
        COUNT(DISTINCT cm.id) as message_count,
        COUNT(DISTINCT ce.id) as evidence_count
      FROM claims c
      LEFT JOIN advertisements a ON c.advertisement_id = a.id
      LEFT JOIN users buyer ON c.user_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      LEFT JOIN users admin ON c.admin_id = admin.id
      LEFT JOIN claim_messages cm ON c.id = cm.claim_id
      LEFT JOIN claim_evidence ce ON c.id = ce.claim_id
      WHERE (c.user_id = ? OR c.seller_id = ?)
    `;

        const params = [userId, userId];

        if (filters.status) {
            query += ` AND c.status = ?`;
            params.push(filters.status);
        }

        query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        const [claims] = await promisePool.query(query, params);
        return claims;
    }

    /**
     * Get claim by ID
     */
    async getClaimById(claimId, userId) {
        const [claims] = await promisePool.query(
            `SELECT 
        c.*,
        a.id as ad_id,
        a.title as ad_title,
        a.description as ad_description,
        a.price as ad_price,
        buyer.id as buyer_id,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        seller.id as seller_id,
        seller.full_name as seller_name,
        seller.email as seller_email,
        admin.id as admin_id,
        admin.full_name as admin_name,
        admin.email as admin_email,
        d.dispute_number,
        d.problem_description as dispute_description
      FROM claims c
      LEFT JOIN advertisements a ON c.advertisement_id = a.id
      LEFT JOIN users buyer ON c.user_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      LEFT JOIN users admin ON c.admin_id = admin.id
      LEFT JOIN disputes d ON c.dispute_id = d.id
      WHERE c.id = ? AND (c.user_id = ? OR c.seller_id = ? OR c.admin_id = ?)`,
            [claimId, userId, userId, userId]
        );

        if (claims.length === 0) {
            return null;
        }

        return claims[0];
    }

    /**
     * Add claim message
     */
    async addClaimMessage(claimId, userId, message, messageType = 'text', isSystemMessage = false) {
        const [result] = await promisePool.query(
            `INSERT INTO claim_messages (claim_id, user_id, message, message_type, is_system_message)
       VALUES (?, ?, ?, ?, ?)`,
            [claimId, userId, message, messageType, isSystemMessage]
        );

        return result.insertId;
    }

    /**
     * Get claim messages
     */
    async getClaimMessages(claimId) {
        const [messages] = await promisePool.query(
            `SELECT 
        cm.*,
        u.full_name as user_name,
        u.email as user_email
       FROM claim_messages cm
       LEFT JOIN users u ON cm.user_id = u.id
       WHERE cm.claim_id = ?
       ORDER BY cm.created_at ASC`,
            [claimId]
        );

        return messages;
    }

    /**
     * Upload claim evidence
     */
    async uploadClaimEvidence(claimId, userId, evidenceData) {
        const [result] = await promisePool.query(
            `INSERT INTO claim_evidence (
        claim_id,
        user_id,
        file_type,
        file_path,
        file_name,
        file_size,
        description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                claimId,
                userId,
                evidenceData.file_type,
                evidenceData.file_path,
                evidenceData.file_name,
                evidenceData.file_size,
                evidenceData.description || null
            ]
        );

        return result.insertId;
    }

    /**
     * Get claim evidence
     */
    async getClaimEvidence(claimId) {
        const [evidence] = await promisePool.query(
            `SELECT 
        ce.*,
        u.full_name as uploaded_by
       FROM claim_evidence ce
       LEFT JOIN users u ON ce.user_id = u.id
       WHERE ce.claim_id = ?
       ORDER BY ce.uploaded_at DESC`,
            [claimId]
        );

        return evidence;
    }

    /**
     * Assign claim to admin
     */
    async assignClaim(claimId, adminId) {
        const [result] = await promisePool.query(
            `UPDATE claims 
       SET admin_id = ?, status = 'under_review', assigned_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
            [adminId, claimId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Claim not found');
        }

        // Add system message
        await this.addClaimMessage(
            claimId,
            adminId,
            'Claim assigned to admin for review',
            'status_update',
            true
        );

        return true;
    }

    /**
     * Submit admin decision
     */
    async submitAdminDecision(claimId, adminId, decisionData) {
        const connection = await promisePool.getConnection();

        try {
            await connection.beginTransaction();

            // Update claim with decision
            const [result] = await connection.query(
                `UPDATE claims 
         SET admin_decision = ?,
             admin_notes = ?,
             resolution_amount = ?,
             status = 'resolved',
             resolved_at = NOW()
         WHERE id = ? AND admin_id = ?`,
                [
                    decisionData.decision,
                    decisionData.notes,
                    decisionData.resolution_amount || null,
                    claimId,
                    adminId
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Claim not found or not assigned to this admin');
            }

            // Add admin decision message
            const decisionText = {
                favor_buyer: 'Admin decision: Favor Buyer - Refund approved',
                favor_seller: 'Admin decision: Favor Seller - No refund',
                partial: `Admin decision: Partial resolution - Refund amount: $${decisionData.resolution_amount}`
            };

            await connection.query(
                `INSERT INTO claim_messages (claim_id, user_id, message, message_type, is_admin_message)
         VALUES (?, ?, ?, 'admin_decision', TRUE)`,
                [claimId, adminId, decisionText[decisionData.decision]]
            );

            // TODO: Process refund if applicable
            // This would integrate with payment gateway

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Close claim
     */
    async closeClaim(claimId, userId) {
        const [result] = await promisePool.query(
            `UPDATE claims 
       SET status = 'closed', closed_at = NOW()
       WHERE id = ? AND (user_id = ? OR seller_id = ? OR admin_id = ?)`,
            [claimId, userId, userId, userId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Claim not found or access denied');
        }

        // Add system message
        await this.addClaimMessage(
            claimId,
            userId,
            'Claim closed',
            'status_update',
            true
        );

        return true;
    }
}

module.exports = new ClaimService();
