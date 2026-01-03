const { promisePool } = require('../config/database');

class DisputeService {
  /**
   * Generate unique dispute number
   */
  async generateDisputeNumber() {
    const [rows] = await promisePool.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(dispute_number, 5) AS UNSIGNED)), 0) + 1 as next_num FROM disputes'
    );
    const nextNum = rows[0].next_num;
    return `DIS${String(nextNum).padStart(8, '0')}`;
  }

  /**
   * Create a new dispute
   */
  async createDispute(data) {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      const disputeNumber = await this.generateDisputeNumber();

      // Set negotiation deadline (3 days from now)
      const negotiationDeadline = new Date();
      negotiationDeadline.setDate(negotiationDeadline.getDate() + 3);

      const [result] = await connection.query(
        `INSERT INTO disputes (
          dispute_number, user_id, advertisement_id, dispute_type,
          dispute_category, problem_description, status, priority,
          negotiation_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          disputeNumber,
          data.user_id,
          data.advertisement_id,
          data.dispute_type,
          data.dispute_category,
          data.problem_description,
          data.priority || 'medium',
          negotiationDeadline
        ]
      );

      const disputeId = result.insertId;

      // Add initial system message
      await connection.query(
        `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
        VALUES (?, ?, ?, TRUE, 'status_update')`,
        [disputeId, data.user_id, 'Dispute created. Our team will review your case within 24-48 hours.']
      );

      await connection.commit();

      return {
        id: disputeId,
        dispute_number: disputeNumber,
        ...data
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user's disputes
   */
  async getUserDisputes(userId, filters = {}) {
    let query = `
      SELECT 
        d.*,
        a.title as ad_title,
        a.price as ad_price,
        buyer.full_name as user_name,
        seller.full_name as seller_name,
        COUNT(DISTINCT dm.id) as message_count,
        COUNT(DISTINCT de.id) as evidence_count
      FROM disputes d
      LEFT JOIN advertisements a ON d.advertisement_id = a.id
      LEFT JOIN users buyer ON d.user_id = buyer.id
      LEFT JOIN users seller ON d.seller_id = seller.id
      LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id
      LEFT JOIN dispute_evidence de ON d.id = de.dispute_id
      WHERE (d.user_id = ? OR d.seller_id = ?)
    `;

    const params = [userId, userId];

    if (filters.status) {
      query += ` AND d.status = ?`;
      params.push(filters.status);
    }

    if (filters.dispute_type) {
      query += ` AND d.dispute_type = ?`;
      params.push(filters.dispute_type);
    }

    query += ` GROUP BY d.id ORDER BY d.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
    }

    const [disputes] = await promisePool.query(query, params);
    return disputes;
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId, userId) {
    const [disputes] = await promisePool.query(
      `SELECT 
        d.*,
        a.id as ad_id,
        a.title as ad_title,
        a.description as ad_description,
        a.price as ad_price,
        buyer.id as buyer_id,
        buyer.full_name as user_name,
        buyer.email as buyer_email,
        seller.id as seller_id,
        seller.full_name as seller_name,
        seller.email as seller_email
      FROM disputes d
      LEFT JOIN advertisements a ON d.advertisement_id = a.id
      LEFT JOIN users buyer ON d.user_id = buyer.id
      LEFT JOIN users seller ON d.seller_id = seller.id
      WHERE d.id = ? AND (d.user_id = ? OR d.seller_id = ?)`,
      [disputeId, userId, userId]
    );

    if (disputes.length === 0) {
      return null;
    }

    return disputes[0];
  }

  /**
   * Get dispute by dispute number
   */
  async getDisputeByNumber(disputeNumber, userId) {
    const [disputes] = await promisePool.query(
      `SELECT 
        d.*,
        a.id as ad_id,
        a.title as ad_title,
        a.description as ad_description,
        a.price as ad_price
      FROM disputes d
      LEFT JOIN advertisements a ON d.advertisement_id = a.id
      WHERE d.dispute_number = ? AND d.user_id = ?`,
      [disputeNumber, userId]
    );

    if (disputes.length === 0) {
      return null;
    }

    return disputes[0];
  }

  /**
   * Add message to dispute
   */
  async addDisputeMessage(disputeId, userId, message, messageType = 'text') {
    const [result] = await promisePool.query(
      `INSERT INTO dispute_messages (dispute_id, user_id, message, message_type)
      VALUES (?, ?, ?, ?)`,
      [disputeId, userId, message, messageType]
    );

    // Update dispute's updated_at
    await promisePool.query(
      'UPDATE disputes SET updated_at = NOW() WHERE id = ?',
      [disputeId]
    );

    return {
      id: result.insertId,
      dispute_id: disputeId,
      user_id: userId,
      message,
      message_type: messageType,
      created_at: new Date()
    };
  }

  /**
   * Get dispute messages
   */
  async getDisputeMessages(disputeId, userId) {
    // Verify user has access to this dispute
    const [disputes] = await promisePool.query(
      'SELECT id FROM disputes WHERE id = ? AND user_id = ?',
      [disputeId, userId]
    );

    if (disputes.length === 0) {
      throw new Error('Dispute not found or access denied');
    }

    const [messages] = await promisePool.query(
      `SELECT 
        dm.*,
        u.full_name,
        u.email
      FROM dispute_messages dm
      LEFT JOIN users u ON dm.user_id = u.id
      WHERE dm.dispute_id = ?
      ORDER BY dm.created_at ASC`,
      [disputeId]
    );

    return messages;
  }

  /**
   * Upload dispute evidence
   */
  async uploadEvidence(disputeId, userId, fileData) {
    const [result] = await promisePool.query(
      `INSERT INTO dispute_evidence (
        dispute_id, user_id, file_type, file_path, file_name, file_size, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        disputeId,
        userId,
        fileData.file_type,
        fileData.file_path,
        fileData.file_name,
        fileData.file_size,
        fileData.description || null
      ]
    );

    return {
      id: result.insertId,
      ...fileData
    };
  }

  /**
   * Get dispute evidence
   */
  async getDisputeEvidence(disputeId, userId) {
    // Verify user has access to this dispute
    const [disputes] = await promisePool.query(
      'SELECT id FROM disputes WHERE id = ? AND user_id = ?',
      [disputeId, userId]
    );

    if (disputes.length === 0) {
      throw new Error('Dispute not found or access denied');
    }

    const [evidence] = await promisePool.query(
      `SELECT * FROM dispute_evidence WHERE dispute_id = ? ORDER BY uploaded_at DESC`,
      [disputeId]
    );

    return evidence;
  }

  /**
   * Check dispute eligibility
   */
  async checkEligibility(disputeId, checks) {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();

      for (const check of checks) {
        await connection.query(
          `INSERT INTO dispute_eligibility_checks (
            dispute_id, check_name, check_result, is_eligible, reason
          ) VALUES (?, ?, ?, ?, ?)`,
          [disputeId, check.name, check.result, check.is_eligible, check.reason]
        );
      }

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
   * Get eligibility checks for a dispute
   */
  async getEligibilityChecks(disputeId, userId) {
    // Verify user has access to this dispute
    const [disputes] = await promisePool.query(
      'SELECT id FROM disputes WHERE id = ? AND user_id = ?',
      [disputeId, userId]
    );

    if (disputes.length === 0) {
      throw new Error('Dispute not found or access denied');
    }

    const [checks] = await promisePool.query(
      `SELECT * FROM dispute_eligibility_checks WHERE dispute_id = ? ORDER BY checked_at DESC`,
      [disputeId]
    );

    return checks;
  }

  /**
   * Update dispute status
   */
  async updateDisputeStatus(disputeId, userId, status, additionalData = {}) {
    const updates = ['status = ?'];
    const params = [status];

    if (status === 'closed' || status === 'resolved') {
      updates.push('closed_at = NOW()');
    }

    if (additionalData.resolution_status) {
      updates.push('resolution_status = ?');
      params.push(additionalData.resolution_status);
    }

    params.push(disputeId, userId);

    const [result] = await promisePool.query(
      `UPDATE disputes SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ? AND user_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('Dispute not found or access denied');
    }

    // Add system message about status change
    await this.addDisputeMessage(
      disputeId,
      userId,
      `Dispute status changed to: ${status}`,
      'status_update'
    );

    return true;
  }

  /**
   * Create dispute resolution
   */
  async createResolution(disputeId, resolutionData) {
    const [result] = await promisePool.query(
      `INSERT INTO dispute_resolutions (
        dispute_id, resolution_type, resolution_amount, resolution_details, resolved_by
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        disputeId,
        resolutionData.resolution_type,
        resolutionData.resolution_amount || null,
        resolutionData.resolution_details,
        resolutionData.resolved_by
      ]
    );

    // Update dispute status to resolved
    await promisePool.query(
      `UPDATE disputes SET status = 'resolved', closed_at = NOW() WHERE id = ?`,
      [disputeId]
    );

    return {
      id: result.insertId,
      ...resolutionData
    };
  }

  /**
   * Get dispute statistics for user
   */
  async getDisputeStats(userId) {
    const [stats] = await promisePool.query(
      `SELECT 
        COUNT(*) as total_disputes,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) as negotiation,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM disputes
      WHERE user_id = ?`,
      [userId]
    );

    return stats[0];
  }

  /**
   * Check if user can create dispute for advertisement
   */
  async canCreateDispute(userId, advertisementId) {
    // Check if there's already an open dispute for this ad by this user
    const [existing] = await promisePool.query(
      `SELECT id FROM disputes 
      WHERE user_id = ? AND advertisement_id = ? 
      AND status NOT IN ('closed', 'resolved')`,
      [userId, advertisementId]
    );

    return existing.length === 0;
  }

  /**
   * Get dispute categories
   */
  getDisputeCategories() {
    return {
      buyer_initiated: [
        'Item not received',
        'Item not as described',
        'Damaged or defective item',
        'Wrong item received',
        'Seller not responding'
      ],
      seller_initiated: [
        'Buyer not paying',
        'Buyer harassment',
        'Buyer wants refund without return',
        'False claim by buyer'
      ],
      transaction_dispute: [
        'Payment issue',
        'Transaction cancelled',
        'Refund not received',
        'Double charged'
      ],
      exchange: [
        'Exchange terms not met',
        'Item condition different',
        'Exchange item not received'
      ],
      issue_negotiation: [
        'Price negotiation issue',
        'Delivery issue',
        'Communication breakdown',
        'Other'
      ]
    };
  }

  /**
   * Send seller's response to dispute
   */
  async sendSellerResponse(disputeId, userId, response, decision) {
    // First verify the user is the seller
    const [dispute] = await promisePool.query(
      'SELECT seller_id, user_id FROM disputes WHERE id = ?',
      [disputeId]
    );

    if (dispute.length === 0) {
      throw new Error('Dispute not found');
    }

    // Check if user is the seller
    if (dispute[0].seller_id !== userId) {
      throw new Error('Only the seller can respond to this dispute');
    }

    // Update dispute with seller's response
    const [result] = await promisePool.query(
      `UPDATE disputes 
       SET seller_response = ?, 
           seller_decision = ?, 
           status = 'awaiting_response',
           updated_at = NOW()
       WHERE id = ?`,
      [response, decision, disputeId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update dispute');
    }

    // Add system message about seller response
    await this.addDisputeMessage(
      disputeId,
      userId,
      `Seller has responded to the dispute with decision: ${decision}`,
      'status_update'
    );

    return true;
  }
}

module.exports = new DisputeService();