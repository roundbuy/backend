const { promisePool } = require('../src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedMissingRewards() {
    console.log('🌱 Seeding missing rewards...');

    try {
        // 1. Referral Earn 2 x Visibility Ads
        await promisePool.query(`
            INSERT INTO reward_categories (name, description, icon, color, type, required_referrals, reward_value, sort_order)
            SELECT 'Referral Earn 2 x Visibility Ads', 'Refer 5 friends and get 2 free visibility boosts for your ads', 'eye', '#2196F3', 'visibility_upgrade', 5, '{"visibility_ads": 2}', 2
            WHERE NOT EXISTS (SELECT 1 FROM reward_categories WHERE name = 'Referral Earn 2 x Visibility Ads');
        `);

        // 2. Make 5 x Ads and Earn 2 x Visibility Ads
        // Note: 'required_referrals' is reused here as 'required_count' for simpler schema, or we rely on description.
        // For now, setting required_referrals to 5 as a placeholder for "5 Ads".
        await promisePool.query(`
            INSERT INTO reward_categories (name, description, icon, color, type, required_referrals, reward_value, sort_order)
            SELECT 'Make 5 x Ads and Earn 2 x Visibility Ads', 'Post 5 advertisements to unlock 2 free visibility boosts', 'post', '#9C27B0', 'visibility_upgrade', 5, '{"visibility_ads": 2}', 3
            WHERE NOT EXISTS (SELECT 1 FROM reward_categories WHERE name = 'Make 5 x Ads and Earn 2 x Visibility Ads');
        `);

        // 3. Sell 7 x products and Earn Diligent Seller mark
        await promisePool.query(`
            INSERT INTO reward_categories (name, description, icon, color, type, required_referrals, reward_value, sort_order)
            SELECT 'Sell 7 x products and Earn Diligent Seller mark', 'Complete 7 sales to earn the verified Diligent Seller badge', 'check-decagram', '#FF9800', 'badge', 7, '{"badge": "diligent_seller"}', 4
            WHERE NOT EXISTS (SELECT 1 FROM reward_categories WHERE name = 'Sell 7 x products and Earn Diligent Seller mark');
        `);

        console.log('✅ Missing rewards seeded successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        process.exit();
    }
}

seedMissingRewards();
