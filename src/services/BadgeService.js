const { promisePool } = require('../config/database');

/**
 * BadgeService - Manages product badges lifecycle
 * Handles creation, expiry, and assignment of badges for advertisements
 */
class BadgeService {
    /**
     * Priority levels for different badge types
     */
    static PRIORITY_LEVELS = {
        top_spot: 100,
        rise_to_top: 90,
        targeted: 80,
        fast: 80,
        diligent_seller: 70,
        gold: 60,
        orange: 50,
        green: 40
    };

    /**
     * Create a badge for an advertisement
     * @param {number} advertisementId - Advertisement ID
     * @param {string} badgeType - 'visibility', 'reward', or 'membership'
     * @param {string} badgeLevel - Level identifier (e.g., 'top_spot', 'gold', 'diligent_seller')
     * @param {Date|null} expiryDate - When badge expires, null for permanent
     * @param {number|null} priorityLevel - Priority level, auto-calculated if null
     * @returns {Promise<number>} Badge ID
     */
    async createBadge(advertisementId, badgeType, badgeLevel, expiryDate = null, priorityLevel = null) {
        try {
            // Auto-calculate priority if not provided
            const priority = priorityLevel !== null
                ? priorityLevel
                : (BadgeService.PRIORITY_LEVELS[badgeLevel] || 0);

            const [result] = await promisePool.query(
                `INSERT INTO product_badges 
         (advertisement_id, badge_type, badge_level, expiry_date, priority_level, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
                [advertisementId, badgeType, badgeLevel, expiryDate, priority]
            );

            console.log(`✅ Created ${badgeType} badge (${badgeLevel}) for ad ${advertisementId} with priority ${priority}`);
            return result.insertId;
        } catch (error) {
            console.error('Error creating badge:', error);
            throw error;
        }
    }

    /**
     * Create or update a badge (upsert)
     * @param {number} advertisementId - Advertisement ID
     * @param {string} badgeType - Badge type
     * @param {string} badgeLevel - Badge level
     * @param {Date|null} expiryDate - Expiry date
     * @param {number|null} priorityLevel - Priority level
     */
    async upsertBadge(advertisementId, badgeType, badgeLevel, expiryDate = null, priorityLevel = null) {
        try {
            const priority = priorityLevel !== null
                ? priorityLevel
                : (BadgeService.PRIORITY_LEVELS[badgeLevel] || 0);

            await promisePool.query(
                `INSERT INTO product_badges 
         (advertisement_id, badge_type, badge_level, expiry_date, priority_level, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE 
           badge_level = VALUES(badge_level),
           expiry_date = VALUES(expiry_date),
           priority_level = VALUES(priority_level),
           is_active = TRUE,
           updated_at = CURRENT_TIMESTAMP`,
                [advertisementId, badgeType, badgeLevel, expiryDate, priority]
            );

            console.log(`✅ Upserted ${badgeType} badge (${badgeLevel}) for ad ${advertisementId}`);
        } catch (error) {
            console.error('Error upserting badge:', error);
            throw error;
        }
    }

    /**
     * Expire badges that are past their expiry date
     * @returns {Promise<number>} Number of badges expired
     */
    async expireExpiredBadges() {
        try {
            const [result] = await promisePool.query(
                `UPDATE product_badges 
         SET is_active = FALSE 
         WHERE expiry_date IS NOT NULL 
           AND expiry_date < NOW() 
           AND is_active = TRUE`
            );

            console.log(`🗑️  Expired ${result.affectedRows} badges`);
            return result.affectedRows;
        } catch (error) {
            console.error('Error expiring badges:', error);
            throw error;
        }
    }

    /**
     * Get active badges for an advertisement
     * @param {number} advertisementId - Advertisement ID
     * @returns {Promise<Array>} Array of active badges
     */
    async getActiveBadges(advertisementId) {
        try {
            const [badges] = await promisePool.query(
                `SELECT id, badge_type, badge_level, expiry_date, priority_level, created_at
         FROM product_badges
         WHERE advertisement_id = ? 
           AND is_active = TRUE
           AND (expiry_date IS NULL OR expiry_date > NOW())
         ORDER BY priority_level DESC`,
                [advertisementId]
            );

            return badges;
        } catch (error) {
            console.error('Error getting active badges:', error);
            throw error;
        }
    }

    /**
     * Assign membership badge to all user's published advertisements
     * @param {number} userId - User ID
     * @param {string} subscriptionSlug - Subscription plan slug (gold, orange, green)
     * @param {Date} expiryDate - When subscription expires
     */
    async assignMembershipBadges(userId, subscriptionSlug, expiryDate) {
        try {
            const badgeLevel = subscriptionSlug.toLowerCase();
            const priority = BadgeService.PRIORITY_LEVELS[badgeLevel] || 0;

            // Get all user's published advertisements
            const [userAds] = await promisePool.query(
                `SELECT id FROM advertisements 
         WHERE user_id = ? AND status = 'published'`,
                [userId]
            );

            console.log(`📋 Assigning ${badgeLevel} membership badges to ${userAds.length} ads for user ${userId}`);

            // Assign badge to each advertisement
            for (const ad of userAds) {
                await this.upsertBadge(ad.id, 'membership', badgeLevel, expiryDate, priority);
            }

            console.log(`✅ Assigned ${badgeLevel} membership badges to ${userAds.length} advertisements`);
            return userAds.length;
        } catch (error) {
            console.error('Error assigning membership badges:', error);
            throw error;
        }
    }

    /**
     * Remove membership badges for a user (when subscription expires/downgrades)
     * @param {number} userId - User ID
     * @param {string|null} specificLevel - Optional: remove only specific level (gold, orange, green)
     */
    async removeMembershipBadges(userId, specificLevel = null) {
        try {
            let query = `
        UPDATE product_badges pb
        JOIN advertisements a ON pb.advertisement_id = a.id
        SET pb.is_active = FALSE
        WHERE a.user_id = ? AND pb.badge_type = 'membership'
      `;
            const params = [userId];

            if (specificLevel) {
                query += ' AND pb.badge_level = ?';
                params.push(specificLevel);
            }

            const [result] = await promisePool.query(query, params);

            console.log(`🗑️  Removed ${result.affectedRows} membership badges for user ${userId}`);
            return result.affectedRows;
        } catch (error) {
            console.error('Error removing membership badges:', error);
            throw error;
        }
    }

    /**
     * Assign Diligent Seller badge to all user's published advertisements
     * @param {number} userId - User ID
     * @param {number} durationMonths - Badge duration in months (default: 3)
     */
    async assignDiligentSellerBadge(userId, durationMonths = 3) {
        try {
            // Calculate expiry date (3 months from now)
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

            // Get all user's published advertisements
            const [userAds] = await promisePool.query(
                `SELECT id FROM advertisements 
         WHERE user_id = ? AND status = 'published'`,
                [userId]
            );

            console.log(`🏆 Assigning Diligent Seller badges to ${userAds.length} ads for user ${userId}`);

            // Assign badge to each advertisement
            for (const ad of userAds) {
                await this.upsertBadge(
                    ad.id,
                    'reward',
                    'diligent_seller',
                    expiryDate,
                    BadgeService.PRIORITY_LEVELS.diligent_seller
                );
            }

            console.log(`✅ Assigned Diligent Seller badges to ${userAds.length} advertisements (expires: ${expiryDate.toISOString()})`);
            return userAds.length;
        } catch (error) {
            console.error('Error assigning Diligent Seller badge:', error);
            throw error;
        }
    }

    /**
     * Check if user qualifies for Diligent Seller badge (7+ completed sales)
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} True if qualifies
     */
    async checkDiligentSellerQualification(userId) {
        try {
            const [result] = await promisePool.query(
                `SELECT COUNT(*) as count FROM orders 
         WHERE seller_id = ? AND status = 'completed'`,
                [userId]
            );

            const completedSales = result[0].count;
            const qualifies = completedSales >= 7;

            console.log(`📊 User ${userId} has ${completedSales} completed sales (qualifies: ${qualifies})`);
            return qualifies;
        } catch (error) {
            console.error('Error checking Diligent Seller qualification:', error);
            throw error;
        }
    }

    /**
     * Assign visibility badge when promotion is purchased
     * @param {number} advertisementId - Advertisement ID
     * @param {string} planType - Promotion plan type (top_spot, rise_to_top, targeted, fast)
     * @param {Date} endDate - When promotion expires
     */
    async assignVisibilityBadge(advertisementId, planType, endDate) {
        try {
            const priority = BadgeService.PRIORITY_LEVELS[planType] || 0;

            await this.createBadge(advertisementId, 'visibility', planType, endDate, priority);

            console.log(`✅ Assigned visibility badge (${planType}) to ad ${advertisementId}`);
        } catch (error) {
            console.error('Error assigning visibility badge:', error);
            throw error;
        }
    }

    /**
     * Get highest priority badge for an advertisement
     * @param {number} advertisementId - Advertisement ID
     * @returns {Promise<Object|null>} Highest priority badge or null
     */
    async getHighestPriorityBadge(advertisementId) {
        try {
            const [badges] = await promisePool.query(
                `SELECT badge_type, badge_level, priority_level, expiry_date
         FROM product_badges
         WHERE advertisement_id = ? 
           AND is_active = TRUE
           AND (expiry_date IS NULL OR expiry_date > NOW())
         ORDER BY priority_level DESC
         LIMIT 1`,
                [advertisementId]
            );

            return badges.length > 0 ? badges[0] : null;
        } catch (error) {
            console.error('Error getting highest priority badge:', error);
            throw error;
        }
    }
}

module.exports = new BadgeService();
