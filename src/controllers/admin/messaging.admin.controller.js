const { promisePool } = require('../../config/database');

// Get all conversations (admin view)
const getConversations = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        // Search by user name or product title
        if (search) {
            whereConditions.push(`(
        a.title LIKE ? OR 
        buyer.full_name LIKE ? OR 
        seller.full_name LIKE ?
      )`);
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Filter by advertisement status
        if (status) {
            whereConditions.push('a.status = ?');
            queryParams.push(status);
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get conversations with details
        const [conversations] = await promisePool.execute(`
      SELECT
        c.id,
        c.advertisement_id,
        c.buyer_id,
        c.seller_id,
        c.last_message_at,
        c.created_at,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        a.status as advertisement_status,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        buyer.avatar as buyer_avatar,
        seller.full_name as seller_name,
        seller.email as seller_email,
        seller.avatar as seller_avatar,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT COUNT(*) FROM offers o WHERE o.conversation_id = c.id) as offer_count
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users seller ON c.seller_id = seller.id
      ${whereClause}
      ORDER BY c.last_message_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

        // Get total count
        const [countResult] = await promisePool.execute(`
      SELECT COUNT(*) as total
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users seller ON c.seller_id = seller.id
      ${whereClause}
    `, queryParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            conversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error('Admin get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations'
        });
    }
};

// Get conversation details with messages
const getConversationDetail = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Get conversation details
        const [conversation] = await promisePool.execute(`
      SELECT
        c.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images,
        a.status as advertisement_status,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        buyer.avatar as buyer_avatar,
        seller.full_name as seller_name,
        seller.email as seller_email,
        seller.avatar as seller_avatar
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users seller ON c.seller_id = seller.id
      WHERE c.id = ?
    `, [conversationId]);

        if (conversation.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.json({
            success: true,
            conversation: conversation[0]
        });

    } catch (error) {
        console.error('Admin get conversation detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation details'
        });
    }
};

// Get messages for a conversation
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Get messages
        const [messages] = await promisePool.execute(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.is_read,
        m.created_at,
        sender.full_name as sender_name,
        sender.avatar as sender_avatar,
        receiver.full_name as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [conversationId, limit, offset]);

        // Get offers
        const [offers] = await promisePool.execute(`
      SELECT
        o.*,
        sender.full_name as sender_name,
        sender.avatar as sender_avatar
      FROM offers o
      JOIN users sender ON o.sender_id = sender.id
      WHERE o.conversation_id = ?
      ORDER BY o.created_at DESC
    `, [conversationId]);

        res.json({
            success: true,
            messages,
            offers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Admin get conversation messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

// Get chat statistics
const getStats = async (req, res) => {
    try {
        // Get conversation stats
        const [conversationStats] = await promisePool.execute(`
      SELECT
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN DATE(last_message_at) = CURDATE() THEN 1 END) as today_conversations,
        COUNT(CASE WHEN DATE(last_message_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_conversations
      FROM conversations
    `);

        // Get message stats
        const [messageStats] = await promisePool.execute(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_messages,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_messages
      FROM messages
    `);

        // Get offer stats
        const [offerStats] = await promisePool.execute(`
      SELECT
        COUNT(*) as total_offers,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_offers,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_offers,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_offers
      FROM offers
    `);

        res.json({
            success: true,
            stats: {
                conversations: conversationStats[0],
                messages: messageStats[0],
                offers: offerStats[0]
            }
        });

    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

// Delete a conversation
const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Delete conversation (cascade will delete messages and offers)
        await promisePool.execute(`
      DELETE FROM conversations WHERE id = ?
    `, [conversationId]);

        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('Admin delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete conversation'
        });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        await promisePool.execute(`
      DELETE FROM messages WHERE id = ?
    `, [messageId]);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Admin delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message'
        });
    }
};

module.exports = {
    getConversations,
    getConversationDetail,
    getConversationMessages,
    getStats,
    deleteConversation,
    deleteMessage
};
