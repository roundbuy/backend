const { promisePool } = require('../../config/database');
const { validationResult } = require('express-validator');
const { createNotificationForUser } = require('../../utils/notificationHelper');
const { checkTextModeration } = require('../../services/moderation.service');

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get conversations where user is buyer or seller
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
        u1.full_name as buyer_name,
        u1.avatar as buyer_avatar,
        u2.full_name as seller_name,
        u2.avatar as seller_avatar,
        m.message as last_message,
        m.sender_id as last_message_sender_id,
        m.is_read,
        CASE
          WHEN c.buyer_id = ? THEN u2.full_name
          ELSE u1.full_name
        END as other_party_name,
        CASE
          WHEN c.buyer_id = ? THEN u2.avatar
          ELSE u1.avatar
        END as other_party_avatar
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      JOIN users u1 ON c.buyer_id = u1.id
      JOIN users u2 ON c.seller_id = u2.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE (c.buyer_id = ? OR c.seller_id = ?)
      AND a.status IN ('published', 'sold')
      GROUP BY c.id
      ORDER BY c.last_message_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, userId, userId, limit, offset]);

    // Get total count
    const [countResult] = await promisePool.execute(`
      SELECT COUNT(*) as total
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      WHERE (c.buyer_id = ? OR c.seller_id = ?)
      AND a.status IN ('published', 'sold')
    `, [userId, userId]);

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
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// Get messages in a conversation
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user has access to this conversation
    const [conversationCheck] = await promisePool.execute(`
      SELECT id FROM conversations
      WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
    `, [conversationId, userId, userId]);

    if (conversationCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Get messages
    const [messages] = await promisePool.execute(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.is_read,
        m.created_at,
        u.full_name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [conversationId, limit, offset]);

    // Mark messages as read (where user is receiver)
    await promisePool.execute(`
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = ? AND receiver_id = ? AND is_read = false
    `, [conversationId, userId]);

    // Get conversation details
    const [conversation] = await promisePool.execute(`
      SELECT
        c.*,
        a.title as advertisement_title,
        a.price as advertisement_price,
        a.images as advertisement_images
      FROM conversations c
      JOIN advertisements a ON c.advertisement_id = a.id
      WHERE c.id = ?
    `, [conversationId]);

    res.json({
      success: true,
      conversation: conversation[0],
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const senderId = req.user.id;
    const { advertisement_id, message } = req.body;

    // Validate required fields
    if (!advertisement_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Advertisement ID and message are required'
      });
    }

    // Validate advertisement exists and is published
    const [adCheck] = await promisePool.execute(`
      SELECT id, user_id as seller_id, status, title
      FROM advertisements
      WHERE id = ? AND status IN ('published', 'sold')
    `, [advertisement_id]);

    if (adCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found or not available'
      });
    }

    const advertisement = adCheck[0];
    const receiverId = advertisement.seller_id;

    // Don't allow messaging yourself (if user is messaging their own ad)
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Check message content for moderation violations
    const moderationResult = await checkTextModeration(message);
    if (!moderationResult.isClean) {
      const violationCategories = moderationResult.foundWords.map(w => w.category);
      const violationWords = moderationResult.foundWords.map(w => w.word);

      console.log(`[CHAT MODERATION] Message blocked for user ${senderId}:`, {
        violations: violationWords,
        categories: violationCategories,
        severity: moderationResult.severity
      });

      return res.status(400).json({
        success: false,
        message: 'Your message contains prohibited content and cannot be sent.',
        error_code: 'CONTENT_MODERATION_FAILED',
        details: {
          violations: violationCategories.includes('contact_info')
            ? ['Phone numbers, emails, and contact information are not allowed in messages.']
            : ['Your message contains inappropriate content.'],
          severity: moderationResult.severity
        }
      });
    }

    // Determine buyer and seller for conversation
    // senderId is always the buyer (interested party)
    // receiverId (advertisement.seller_id) is always the seller
    const buyerId = senderId;
    const sellerId = advertisement.seller_id;

    // Get or create conversation
    let conversationId;
    const [existingConversation] = await promisePool.execute(`
      SELECT id FROM conversations
      WHERE advertisement_id = ? AND buyer_id = ? AND seller_id = ?
    `, [advertisement_id, buyerId, sellerId]);

    if (existingConversation.length > 0) {
      conversationId = existingConversation[0].id;
    } else {
      // Create new conversation
      const [result] = await promisePool.execute(`
        INSERT INTO conversations (advertisement_id, buyer_id, seller_id)
        VALUES (?, ?, ?)
      `, [advertisement_id, buyerId, sellerId]);
      conversationId = result.insertId;
    }

    // Insert message
    const [messageResult] = await promisePool.execute(`
      INSERT INTO messages (sender_id, receiver_id, advertisement_id, conversation_id, message)
      VALUES (?, ?, ?, ?, ?)
    `, [senderId, receiverId, advertisement_id, conversationId, message]);

    // Update conversation last_message_at
    await promisePool.execute(`
      UPDATE conversations
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [conversationId]);

    // Get the inserted message with sender details
    const [newMessage] = await promisePool.execute(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.is_read,
        m.created_at,
        u.full_name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageResult.insertId]);

    // Create notification for receiver
    try {
      await createNotificationForUser({
        user_id: receiverId,
        type: 'popup',
        title: 'New Message',
        message: `${newMessage[0].sender_name} sent you a message`,
        data: {
          conversation_id: conversationId,
          advertisement_id,
          message_id: messageResult.insertId
        },
        action_type: 'open_screen',
        action_data: {
          screen: 'ProductChat',
          params: {
            conversationId,
            advertisement: { id: advertisement_id }
          }
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the message send if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message: newMessage[0],
      conversation_id: conversationId
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Make an offer
const makeOffer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const senderId = req.user.id;
    const { conversation_id, offered_price, message } = req.body;

    // Verify user has access to conversation and get conversation details
    const [conversationCheck] = await promisePool.execute(`
      SELECT c.id, c.advertisement_id, c.buyer_id, c.seller_id
      FROM conversations c
      WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)
    `, [conversation_id, senderId, senderId]);

    if (conversationCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const conversation = conversationCheck[0];

    // Check if there's already a pending offer in this conversation
    const [pendingOffer] = await promisePool.execute(`
      SELECT id FROM offers
      WHERE conversation_id = ? AND status = 'pending'
    `, [conversation_id]);

    if (pendingOffer.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending offer in this conversation'
      });
    }

    // Get user's currency preference (for display purposes)
    const [userPrefs] = await promisePool.execute(`
      SELECT currency_code FROM users WHERE id = ?
    `, [senderId]);

    const currencyCode = userPrefs[0]?.currency_code || 'INR';

    // Check offer message for moderation violations (if message is provided)
    if (message) {
      const moderationResult = await checkTextModeration(message);
      if (!moderationResult.isClean) {
        const violationCategories = moderationResult.foundWords.map(w => w.category);
        const violationWords = moderationResult.foundWords.map(w => w.word);

        console.log(`[OFFER MODERATION] Offer message blocked for user ${senderId}:`, {
          violations: violationWords,
          categories: violationCategories,
          severity: moderationResult.severity
        });

        return res.status(400).json({
          success: false,
          message: 'Your offer message contains prohibited content and cannot be sent.',
          error_code: 'CONTENT_MODERATION_FAILED',
          details: {
            violations: violationCategories.includes('contact_info')
              ? ['Phone numbers, emails, and contact information are not allowed in offer messages.']
              : ['Your offer message contains inappropriate content.'],
            severity: moderationResult.severity
          }
        });
      }
    }

    // Insert offer with advertisement_id, buyer_id, and seller_id
    const [result] = await promisePool.execute(`
      INSERT INTO offers (
        conversation_id, 
        advertisement_id, 
        buyer_id, 
        seller_id, 
        sender_id, 
        offered_price, 
        message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      conversation_id,
      conversation.advertisement_id,
      conversation.buyer_id,
      conversation.seller_id,
      senderId,
      offered_price,
      message || ''
    ]);

    // Get the inserted offer
    const [newOffer] = await promisePool.execute(`
      SELECT
        o.*,
        u.full_name as sender_name,
        u.avatar as sender_avatar,
        a.title as advertisement_title
      FROM offers o
      JOIN users u ON o.sender_id = u.id
      JOIN advertisements a ON o.advertisement_id = a.id
      WHERE o.id = ?
    `, [result.insertId]);

    // Create notification for seller (receiver of the offer)
    const receiverId = conversation.seller_id;
    try {
      await createNotificationForUser({
        user_id: receiverId,
        type: 'popup',
        title: 'New Offer Received',
        message: `${newOffer[0].sender_name} offered ${currencyCode} ${offered_price} on ${newOffer[0].advertisement_title}`,
        data: {
          conversation_id,
          offer_id: result.insertId,
          advertisement_id: conversation.advertisement_id
        },
        action_type: 'open_screen',
        action_data: {
          screen: 'ProductChat',
          params: {
            conversationId: conversation_id,
            advertisement: { id: conversation.advertisement_id }
          }
        }
      });
    } catch (notifError) {
      console.error('Failed to create offer notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Offer sent successfully',
      offer: newOffer[0]
    });

  } catch (error) {
    console.error('Make offer error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send offer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Respond to offer (accept/reject)
const respondToOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offerId } = req.params;
    const { action, counter_price } = req.body; // action: 'accept', 'reject', 'counter'

    // Get offer details
    const [offerCheck] = await promisePool.execute(`
      SELECT o.*, c.advertisement_id, c.buyer_id, c.seller_id
      FROM offers o
      JOIN conversations c ON o.conversation_id = c.id
      WHERE o.id = ? AND o.status = 'pending'
    `, [offerId]);

    if (offerCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or already responded to'
      });
    }

    const offer = offerCheck[0];

    // Verify user can respond to this offer
    const isBuyer = offer.buyer_id === userId;
    const isSeller = offer.seller_id === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this offer'
      });
    }

    let newStatus;
    let updateData = {};

    if (action === 'accept') {
      newStatus = 'accepted';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'counter' && counter_price) {
      newStatus = 'counter_offered';
      updateData.offered_price = counter_price;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action or missing counter price'
      });
    }

    // Update offer
    await promisePool.execute(`
      UPDATE offers
      SET status = ?, offered_price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, updateData.offered_price || offer.offered_price, offerId]);

    // If counter offer, create a new offer
    if (action === 'counter') {
      await promisePool.execute(`
        INSERT INTO offers (
          conversation_id, 
          advertisement_id, 
          buyer_id, 
          seller_id, 
          sender_id, 
          offered_price, 
          message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        offer.conversation_id,
        offer.advertisement_id,
        offer.buyer_id,
        offer.seller_id,
        userId,
        counter_price,
        `Counter offer: ${counter_price}`
      ]);
    }

    // Create notification for offer sender
    try {
      const notificationReceiverId = offer.sender_id;
      let notificationTitle, notificationMessage, notificationType;

      if (action === 'accept') {
        notificationType = 'offer_accepted';
        notificationTitle = 'Offer Accepted!';
        notificationMessage = `Your offer of ${offer.currency_code} ${offer.offered_price} was accepted`;
      } else if (action === 'reject') {
        notificationType = 'offer_rejected';
        notificationTitle = 'Offer Declined';
        notificationMessage = `Your offer of ${offer.currency_code} ${offer.offered_price} was declined`;
      } else if (action === 'counter') {
        notificationType = 'offer_counter';
        notificationTitle = 'Counter Offer Received';
        notificationMessage = `Counter offer of ${offer.currency_code} ${counter_price} received`;
      }

      if (notificationType) {
        await createNotificationForUser({
          user_id: notificationReceiverId,
          type: 'popup',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            conversation_id: offer.conversation_id,
            offer_id: offerId,
            advertisement_id: offer.advertisement_id,
            action
          },
          action_type: 'open_screen',
          action_data: {
            screen: 'ProductChat',
            params: {
              conversationId: offer.conversation_id,
              advertisement: { id: offer.advertisement_id }
            }
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to create offer response notification:', notifError);
    }

    res.json({
      success: true,
      message: `Offer ${action === 'counter' ? 'countered' : action + 'ed'} successfully`
    });

  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to offer'
    });
  }
};

// Get offers for a conversation
const getConversationOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify access
    const [accessCheck] = await promisePool.execute(`
      SELECT id FROM conversations
      WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
    `, [conversationId, userId, userId]);

    if (accessCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Get offers
    const [offers] = await promisePool.execute(`
      SELECT
        o.*,
        u.full_name as sender_name,
        u.avatar as sender_avatar
      FROM offers o
      JOIN users u ON o.sender_id = u.id
      WHERE o.conversation_id = ?
      ORDER BY o.created_at DESC
    `, [conversationId]);

    res.json({
      success: true,
      offers
    });

  } catch (error) {
    console.error('Get conversation offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers'
    });
  }
};

module.exports = {
  getConversations,
  getConversationMessages,
  sendMessage,
  makeOffer,
  respondToOffer,
  getConversationOffers
};