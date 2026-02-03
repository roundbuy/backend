const { promisePool } = require('../src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateRewards() {
    console.log('🔄 Updating Rewards...');

    try {
        // 1. Referral Earn Gold Plan
        await promisePool.query('UPDATE reward_categories SET sort_order = 1 WHERE name = "Referral Earn Gold Plan"');

        // 2. Referral Earn 2 x Visibility Ads
        await promisePool.query('UPDATE reward_categories SET sort_order = 2 WHERE name = "Referral Earn 2 x Visibility Ads"');

        // 3. Make 5 x Ads and Earn 2 x Visibility Ads
        await promisePool.query('UPDATE reward_categories SET sort_order = 3 WHERE name = "Make 5 x Ads and Earn 2 x Visibility Ads"');

        // 4. Sell 7 x products and Earn Diligent Seller mark
        await promisePool.query('UPDATE reward_categories SET sort_order = 4 WHERE name = "Sell 7 x products and Earn Diligent Seller mark"');

        // 5. Most Popular Searches now
        await promisePool.query('UPDATE reward_categories SET sort_order = 5 WHERE name = "Most Popular Searches now"');

        // 6. 10 x Lottery every month £100.00 RB credit
        // Update name and order
        await promisePool.query('UPDATE reward_categories SET name = "10 x Lottery every month £100.00 RB credit", sort_order = 6 WHERE name LIKE "10 x Lottery every month%"');

        // 7. Bonus 5 x Pick it Up Yourself
        await promisePool.query('UPDATE reward_categories SET sort_order = 7 WHERE name = "Bonus 5 x Pick it Up Yourself"');

        console.log('✅ Rewards updated successfully!');

    } catch (error) {
        console.error('❌ Update failed:', error);
    } finally {
        process.exit();
    }
}

updateRewards();
