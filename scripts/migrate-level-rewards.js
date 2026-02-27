require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy',
    multipleStatements: true
};

async function runLevelRewardsMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Running Level Rewards Migration...');

        // 1. Add columns to users table
        const alterUsersSQL = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS current_reward_points INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS lifetime_reward_points INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS current_reward_level ENUM('beginner', 'advanced', 'exclusive') DEFAULT 'beginner',
            ADD COLUMN IF NOT EXISTS level_achieved_date TIMESTAMP NULL DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS points_reset_date TIMESTAMP NULL DEFAULT NULL;
        `;

        try {
            await connection.query(alterUsersSQL);
            console.log('✅ Added reward columns to users table.');
        } catch (e) {
            console.log('⚠️ Could not add columns to users (they might already exist):', e.message);
        }

        // 2. Modify reward_categories ENUM to support 'level_reward'
        try {
            await connection.query(`
               ALTER TABLE reward_categories 
               MODIFY COLUMN type ENUM('plan_upgrade', 'visibility_upgrade', 'badge', 'popular_searches', 'lottery', 'pickup_bonus', 'level_reward') NOT NULL;
           `);
            console.log('✅ Updated reward_categories ENUM type.');
        } catch (e) {
            console.log('⚠️ Could not update ENUM type:', e.message);
        }

        // 3. Add columns to reward_categories for Level and Earnable Once properties
        try {
            await connection.query(`
               ALTER TABLE reward_categories 
               ADD COLUMN IF NOT EXISTS required_level ENUM('beginner', 'advanced', 'exclusive') DEFAULT 'beginner',
               ADD COLUMN IF NOT EXISTS is_earnable_once BOOLEAN DEFAULT FALSE,
               ADD COLUMN IF NOT EXISTS points_cost INT DEFAULT 100;
           `);
            console.log('✅ Added extra columns to reward_categories.');
        } catch (e) {
            console.log('⚠️ Could not add columns to reward_categories:', e.message);
        }

        // 4. Update user_rewards_progress to allow tracking 5/5
        // (progress_count already exists, we will use it)
        // Ensure we track if the reward is completed, and we handle multiple redemptions for 'earnable repeatedly'.

        // 5. Seed some data
        console.log('Seeding Level Rewards data...');
        const seedSQL = `
            INSERT INTO reward_categories (name, description, icon, color, type, required_referrals, required_level, is_earnable_once, points_cost, reward_value, is_active, sort_order) 
            VALUES 
            ('Earn Visibility Boost (Once)', 'Buy 2 x Visibility Boosts or 1 x Visibility of worth £10.00', 'eye', '#4CAF50', 'level_reward', 5, 'beginner', TRUE, 100, '{"visibility_ads": 2}', TRUE, 10),
            ('Earn Visibility Boost (Repeat)', 'Buy 2 x Visibility Boosts or 1 x Visibility of worth £10.00', 'eye', '#001F5F', 'level_reward', 5, 'beginner', FALSE, 100, '{"visibility_ads": 2}', TRUE, 11),
            ('Earn Visibility Boost (Adv)', 'Buy 2 x Visibility Boosts or 1 x Visibility of worth £10.00', 'eye', '#001F5F', 'level_reward', 5, 'advanced', FALSE, 100, '{"visibility_ads": 2}', TRUE, 12),
            ('Earn Visibility Boost (Exc)', 'Buy 2 x Visibility Boosts or 1 x Visibility of worth £10.00', 'eye', '#001F5F', 'level_reward', 5, 'exclusive', FALSE, 100, '{"visibility_ads": 2}', TRUE, 13);
        `;

        try {
            await connection.query(seedSQL);
            console.log('✅ Seeded level rewards categories.');
        } catch (e) {
            console.log('⚠️ Could not seed data:', e.message);
        }

        // 6. Give the current test user some points for testing
        // We assume User ID 1 is the main test user, or we just update all for testing
        try {
            const now = new Date();
            const resetDate = new Date();
            resetDate.setFullYear(now.getFullYear() + 1); // 1 year validity

            await connection.query(`
                UPDATE users 
                SET current_reward_points = 550, 
                    lifetime_reward_points = 550, 
                    current_reward_level = 'beginner',
                    level_achieved_date = NOW(),
                    points_reset_date = ?
            `, [resetDate]);
            console.log('✅ Updated test users with initial points (550).');
        } catch (e) {
            console.log('⚠️ Could not update users points:', e.message);
        }

        console.log('🎉 Migration & Seeding Complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runLevelRewardsMigration();
