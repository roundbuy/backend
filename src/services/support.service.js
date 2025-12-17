const pool = require('../config/database');

class SupportService {
  /**
   * Generate unique ticket number
   */
  async generateTicketNumber() {
    const [rows] = await pool.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number, 4) AS UNSIGNED)), 0) + 1 as next_num FROM support_tickets'
    );
    const nextNum = rows[0].next_num;
    return `TKT${String(nextNum).padStart(8, '0')}`;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const ticketNumber = await this.generateTicketNumber();

      const [result] = await connection.query(
        `INSERT INTO support_tickets (
          ticket_number, user_id, category, subject, description,
          related_ad_id, status, priority
        ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
        [
          ticketNumber,
          data.user_id,
          data.category,
          data.subject,
          data.description,
          data.related_ad_id || null,
          data.priority || 'medium'
        ]
      );

      const ticketId = result.insertId;

      // Add initial system message
      await connection.query(
        `INSERT INTO support_ticket_messages (ticket_id, user_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
        [ticketId, data.user_id, 'Your support ticket has been created. Our team will respond within 24-48 hours.']
      );

      await connection.commit();

      return {
        id: ticketId,
        ticket_number: ticketNumber,
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
   * Get user's support tickets
   */
  async getUserTickets(userId, filters = {}) {
    let query = `
      SELECT 
        st.*,
        COUNT(DISTINCT stm.id) as message_count,
        COUNT(DISTINCT sta.id) as attachment_count,
        (SELECT message FROM support_ticket_messages 
         WHERE ticket_id = st.id 
         ORDER BY created_at DESC LIMIT 1) as last_message
      FROM support_tickets st
      LEFT JOIN support_ticket_messages stm ON st.id = stm.ticket_id
      LEFT JOIN support_ticket_attachments sta ON st.id = sta.ticket_id
      WHERE st.user_id = ?
    `;

    const params = [userId];

    if (filters.status) {
      query += ` AND st.status = ?`;
      params.push(filters.status);
    }

    if (filters.category) {
      query += ` AND st.category = ?`;
      params.push(filters.category);
    }

    query += ` GROUP BY st.id ORDER BY st.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
    }

    const [tickets] = await pool.query(query, params);
    return tickets;
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId, userId) {
    const [tickets] = await pool.query(
      `SELECT 
        st.*,
        a.title as ad_title,
        a.price as ad_price,
        a.image_url as ad_image
      FROM support_tickets st
      LEFT JOIN advertisements a ON st.related_ad_id = a.id
      WHERE st.id = ? AND st.user_id = ?`,
      [ticketId, userId]
    );

    if (tickets.length === 0) {
      return null;
    }

    return tickets[0];
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber, userId) {
    const [tickets] = await pool.query(
      `SELECT 
        st.*,
        a.title as ad_title,
        a.price as ad_price,
        a.image_url as ad_image
      FROM support_tickets st
      LEFT JOIN advertisements a ON st.related_ad_id = a.id
      WHERE st.ticket_number = ? AND st.user_id = ?`,
      [ticketNumber, userId]
    );

    if (tickets.length === 0) {
      return null;
    }

    return tickets[0];
  }

  /**
   * Add message to ticket
   */
  async addTicketMessage(ticketId, userId, message) {
    const [result] = await pool.query(
      `INSERT INTO support_ticket_messages (ticket_id, user_id, message)
      VALUES (?, ?, ?)`,
      [ticketId, userId, message]
    );

    // Update ticket's updated_at and status
    await pool.query(
      `UPDATE support_tickets 
      SET updated_at = NOW(), 
          status = CASE WHEN status = 'awaiting_user' THEN 'in_progress' ELSE status END
      WHERE id = ?`,
      [ticketId]
    );

    return {
      id: result.insertId,
      ticket_id: ticketId,
      user_id: userId,
      message,
      created_at: new Date()
    };
  }

  /**
   * Get ticket messages
   */
  async getTicketMessages(ticketId, userId) {
    // Verify user has access to this ticket
    const [tickets] = await pool.query(
      'SELECT id FROM support_tickets WHERE id = ? AND user_id = ?',
      [ticketId, userId]
    );

    if (tickets.length === 0) {
      throw new Error('Ticket not found or access denied');
    }

    const [messages] = await pool.query(
      `SELECT 
        stm.*,
        u.username,
        u.email
      FROM support_ticket_messages stm
      LEFT JOIN users u ON stm.user_id = u.id
      WHERE stm.ticket_id = ?
      ORDER BY stm.created_at ASC`,
      [ticketId]
    );

    return messages;
  }

  /**
   * Upload ticket attachment
   */
  async uploadAttachment(ticketId, messageId, fileData) {
    const [result] = await pool.query(
      `INSERT INTO support_ticket_attachments (
        ticket_id, message_id, file_path, file_name, file_type, file_size
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        messageId || null,
        fileData.file_path,
        fileData.file_name,
        fileData.file_type,
        fileData.file_size
      ]
    );

    return {
      id: result.insertId,
      ...fileData
    };
  }

  /**
   * Get ticket attachments
   */
  async getTicketAttachments(ticketId, userId) {
    // Verify user has access to this ticket
    const [tickets] = await pool.query(
      'SELECT id FROM support_tickets WHERE id = ? AND user_id = ?',
      [ticketId, userId]
    );

    if (tickets.length === 0) {
      throw new Error('Ticket not found or access denied');
    }

    const [attachments] = await pool.query(
      `SELECT * FROM support_ticket_attachments 
      WHERE ticket_id = ? 
      ORDER BY uploaded_at DESC`,
      [ticketId]
    );

    return attachments;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId, userId, status) {
    const updates = ['status = ?'];
    const params = [status];

    if (status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }

    if (status === 'closed') {
      updates.push('closed_at = NOW()');
    }

    params.push(ticketId, userId);

    const [result] = await pool.query(
      `UPDATE support_tickets SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ? AND user_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('Ticket not found or access denied');
    }

    // Add system message about status change
    await pool.query(
      `INSERT INTO support_ticket_messages (ticket_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
      [ticketId, userId, `Ticket status changed to: ${status}`]
    );

    return true;
  }

  /**
   * Get ticket statistics for user
   */
  async getTicketStats(userId) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'awaiting_user' THEN 1 ELSE 0 END) as awaiting_user,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM support_tickets
      WHERE user_id = ?`,
      [userId]
    );

    return stats[0];
  }

  // ==========================================
  // DELETED ADVERTISEMENTS & APPEALS
  // ==========================================

  /**
   * Track deleted advertisement
   */
  async trackDeletedAd(adData) {
    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + 30); // 30 days to appeal

    const [result] = await pool.query(
      `INSERT INTO deleted_advertisements (
        original_ad_id, user_id, title, category_id, price,
        original_data, deletion_reason, deletion_reason_details,
        deleted_by, can_appeal, appeal_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adData.ad_id,
        adData.user_id,
        adData.title,
        adData.category_id,
        adData.price,
        JSON.stringify(adData.original_data || {}),
        adData.deletion_reason,
        adData.deletion_reason_details,
        adData.deleted_by || null,
        adData.can_appeal !== false, // Default to true
        appealDeadline
      ]
    );

    return {
      id: result.insertId,
      ...adData
    };
  }

  /**
   * Get user's deleted ads
   */
  async getDeletedAds(userId, filters = {}) {
    let query = `
      SELECT * FROM deleted_advertisements
      WHERE user_id = ?
    `;

    const params = [userId];

    if (filters.can_appeal !== undefined) {
      query += ` AND can_appeal = ?`;
      params.push(filters.can_appeal);
    }

    if (filters.appeal_status) {
      query += ` AND appeal_status = ?`;
      params.push(filters.appeal_status);
    }

    query += ` ORDER BY deleted_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
    }

    const [deletedAds] = await pool.query(query, params);
    return deletedAds;
  }

  /**
   * Get deleted ad by ID
   */
  async getDeletedAdById(deletedAdId, userId) {
    const [ads] = await pool.query(
      `SELECT * FROM deleted_advertisements
      WHERE id = ? AND user_id = ?`,
      [deletedAdId, userId]
    );

    if (ads.length === 0) {
      return null;
    }

    return ads[0];
  }

  /**
   * Create appeal for deleted ad
   */
  async createAppeal(deletedAdId, userId, appealData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if ad exists and can be appealed
      const [ads] = await connection.query(
        `SELECT * FROM deleted_advertisements
        WHERE id = ? AND user_id = ? AND can_appeal = TRUE 
        AND appeal_status = 'not_appealed'
        AND appeal_deadline > NOW()`,
        [deletedAdId, userId]
      );

      if (ads.length === 0) {
        throw new Error('Advertisement cannot be appealed or appeal deadline has passed');
      }

      const deletedAd = ads[0];

      // Create support ticket for the appeal
      const ticketNumber = await this.generateTicketNumber();

      const [ticketResult] = await connection.query(
        `INSERT INTO support_tickets (
          ticket_number, user_id, category, subject, description,
          related_ad_id, status, priority
        ) VALUES (?, ?, 'ad_appeal', ?, ?, ?, 'open', 'high')`,
        [
          ticketNumber,
          userId,
          `Appeal for deleted ad: ${deletedAd.title}`,
          appealData.appeal_reason,
          deletedAd.original_ad_id
        ]
      );

      const ticketId = ticketResult.insertId;

      // Update deleted ad appeal status
      await connection.query(
        `UPDATE deleted_advertisements
        SET appeal_status = 'pending'
        WHERE id = ?`,
        [deletedAdId]
      );

      // Add initial message to ticket
      await connection.query(
        `INSERT INTO support_ticket_messages (ticket_id, user_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
        [
          ticketId,
          userId,
          'Your appeal has been submitted. Our team will review it within 3-5 business days.'
        ]
      );

      await connection.commit();

      return {
        ticket_id: ticketId,
        ticket_number: ticketNumber,
        deleted_ad_id: deletedAdId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update appeal status
   */
  async updateAppealStatus(deletedAdId, userId, status, reason = null) {
    const [result] = await pool.query(
      `UPDATE deleted_advertisements
      SET appeal_status = ?
      WHERE id = ? AND user_id = ?`,
      [status, deletedAdId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Deleted ad not found or access denied');
    }

    return true;
  }

  /**
   * Get appeal statistics
   */
  async getAppealStats(userId) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_deleted,
        SUM(CASE WHEN can_appeal = TRUE THEN 1 ELSE 0 END) as can_appeal,
        SUM(CASE WHEN appeal_status = 'not_appealed' THEN 1 ELSE 0 END) as not_appealed,
        SUM(CASE WHEN appeal_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN appeal_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN appeal_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM deleted_advertisements
      WHERE user_id = ?`,
      [userId]
    );

    return stats[0];
  }

  /**
   * Get support categories
   */
  getSupportCategories() {
    return [
      { value: 'deleted_ads', label: 'Deleted Ads', icon: 'trash' },
      { value: 'ad_appeal', label: 'Ad Appeals', icon: 'gavel' },
      { value: 'general', label: 'General Inquiry', icon: 'help-circle' },
      { value: 'technical', label: 'Technical Issue', icon: 'settings' },
      { value: 'billing', label: 'Billing & Payments', icon: 'credit-card' },
      { value: 'account', label: 'Account Issues', icon: 'user' },
      { value: 'other', label: 'Other', icon: 'more-horizontal' }
    ];
  }

  /**
   * Check if user has open tickets
   */
  async hasOpenTickets(userId, category = null) {
    let query = `SELECT COUNT(*) as count FROM support_tickets 
                WHERE user_id = ? AND status IN ('open', 'in_progress')`;
    const params = [userId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }
}

module.exports = new SupportService();