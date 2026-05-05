const { promisePool } = require('../config/database');

class ResolutionInboxService {
  /**
   * Get unified resolution inbox for a user
   */
  async getResolutionInbox(userId) {
    // 1. Fetch from issues (One record per unique issue)
    const [issues] = await promisePool.query(`
      SELECT 
        'issue' as type,
        i.id as ref_id,
        i.issue_number as ref_number,
        a.title as ad_title,
        a.images as ad_images,
        u.full_name as actor_name,
        u.avatar as actor_avatar,
        COALESCE(im.message, 'No status updates yet') as message,
        COALESCE(im.created_at, i.created_at) as created_at,
        i.status as status,
        'Stage 1' as stage
      FROM issues i
      JOIN advertisements a ON i.advertisement_id = a.id
      LEFT JOIN (
        SELECT issue_id, sender_id, message, created_at,
               ROW_NUMBER() OVER(PARTITION BY issue_id ORDER BY created_at DESC) as rn
        FROM issue_messages
        WHERE is_system_message = TRUE
      ) im ON i.id = im.issue_id AND im.rn = 1
      LEFT JOIN users u ON im.sender_id = u.id
      WHERE (i.created_by = ? OR i.other_party_id = ?)
      ORDER BY created_at DESC
    `, [userId, userId]);

    // 2. Fetch from disputes (One record per unique dispute)
    const [disputes] = await promisePool.query(`
      SELECT 
        'dispute' as type,
        d.id as ref_id,
        d.dispute_number as ref_number,
        a.title as ad_title,
        a.images as ad_images,
        u.full_name as actor_name,
        u.avatar as actor_avatar,
        COALESCE(dm.message, 'No status updates yet') as message,
        COALESCE(dm.created_at, d.created_at) as created_at,
        d.status as status,
        'Stage 2' as stage
      FROM disputes d
      JOIN advertisements a ON d.advertisement_id = a.id
      LEFT JOIN (
        SELECT dispute_id, user_id, message, created_at,
               ROW_NUMBER() OVER(PARTITION BY dispute_id ORDER BY created_at DESC) as rn
        FROM dispute_messages
        WHERE is_system_message = TRUE
      ) dm ON d.id = dm.dispute_id AND dm.rn = 1
      LEFT JOIN users u ON dm.user_id = u.id
      WHERE (d.user_id = ? OR d.seller_id = ?)
      ORDER BY created_at DESC
    `, [userId, userId]);

    // 3. Fetch from claims (One record per unique claim)
    const [claims] = await promisePool.query(`
      SELECT 
        'claim' as type,
        c.id as ref_id,
        c.claim_number as ref_number,
        a.title as ad_title,
        a.images as ad_images,
        u.full_name as actor_name,
        u.avatar as actor_avatar,
        COALESCE(cm.message, 'No status updates yet') as message,
        COALESCE(cm.created_at, c.created_at) as created_at,
        c.status as status,
        'Stage 3' as stage
      FROM claims c
      JOIN advertisements a ON c.advertisement_id = a.id
      LEFT JOIN (
        SELECT claim_id, user_id, message, created_at,
               ROW_NUMBER() OVER(PARTITION BY claim_id ORDER BY created_at DESC) as rn
        FROM claim_messages
        WHERE is_system_message = TRUE
      ) cm ON c.id = cm.claim_id AND cm.rn = 1
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE (c.user_id = ? OR c.seller_id = ?)
      ORDER BY created_at DESC
    `, [userId, userId]);

    // Combine and sort by date
    const all = [...issues, ...disputes, ...claims];
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Map to specific action link text based on content
    return all.map(item => {
      let ad_image = null;
      try {
        if (item.ad_images) {
          const imgs = typeof item.ad_images === 'string' ? JSON.parse(item.ad_images) : item.ad_images;
          if (Array.isArray(imgs) && imgs.length > 0) {
            ad_image = imgs[0];
          }
        }
      } catch (e) {
        console.error('Error parsing ad_images:', e);
      }

      return {
        ...item,
        ad_image,
        action_text: this._mapActionText(item)
      };
    });
  }

  _mapActionText(item) {
    const msg = item.message.toLowerCase();
    if (msg.includes('created')) return 'See Demand';
    if (msg.includes('responded')) return 'See Response';
    if (msg.includes('negotiate')) return 'See Negotiation';
    if (msg.includes('settled')) return 'See Settlement';
    return 'View Details';
  }
}

module.exports = new ResolutionInboxService();
