const { promisePool } = require('../config/database');
const BadgeService = require('../services/BadgeService');

/**
 * Cron job to expire badges that are past their expiry date
 * Run this every hour or daily
 */
async function expireBadges() {
    try {
        console.log('🔄 Starting badge expiry job...');

        const expiredCount = await BadgeService.expireExpiredBadges();

        console.log(`✅ Badge expiry job completed. Expired ${expiredCount} badges.`);
    } catch (error) {
        console.error('❌ Error in badge expiry job:', error);
    }
}

/**
 * Check and assign Diligent Seller badges to qualifying users
 * Run this after each order completion or daily
 */
async function checkDiligentSellerBadges() {
    try {
        console.log('🔄 Checking for Diligent Seller badge qualifications...');

        // Get users with 7+ completed sales who don't have the badge
        const [qualifyingUsers] = await promisePool.query(`
      SELECT DISTINCT o.seller_id, COUNT(*) as sales_count
      FROM orders o
      WHERE o.status = 'completed'
      GROUP BY o.seller_id
      HAVING sales_count >= 7
    `);

        console.log(`📊 Found ${qualifyingUsers.length} users with 7+ sales`);

        let assignedCount = 0;
        for (const user of qualifyingUsers) {
            // Check if user already has active Diligent Seller badge
            const [existingBadges] = await promisePool.query(`
        SELECT pb.id
        FROM product_badges pb
        JOIN advertisements a ON pb.advertisement_id = a.id
        WHERE a.user_id = ? 
          AND pb.badge_type = 'reward' 
          AND pb.badge_level = 'diligent_seller'
          AND pb.is_active = TRUE
          AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
        LIMIT 1
      `, [user.seller_id]);

            if (existingBadges.length === 0) {
                // Assign Diligent Seller badge
                await BadgeService.assignDiligentSellerBadge(user.seller_id, 3);
                assignedCount++;
            }
        }

        console.log(`✅ Assigned Diligent Seller badges to ${assignedCount} users`);
    } catch (error) {
        console.error('❌ Error in Diligent Seller badge check:', error);
    }
}

// Export functions for cron scheduling
module.exports = {
    expireBadges,
    checkDiligentSellerBadges
};

// If running directly (for testing or manual execution)
if (require.main === module) {
    (async () => {
        await expireBadges();
        await checkDiligentSellerBadges();
        process.exit(0);
    })();
}
