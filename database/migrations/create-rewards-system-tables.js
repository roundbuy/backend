/**
 * Rewards System Migration
 * Creates tables for reward categories, user progress, referrals, lottery, and popular searches.
 * Adds referral_code column to users table.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy',
    multipleStatements: true
};

const migrationSQL = `
-- ============================================================================
-- Update: Users Table
-- Description: Add referral code to users
-- ============================================================================
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "referral_code";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE DEFAULT NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Table: reward_categories
-- Description: Stores configuration for different rewards
-- ============================================================================
CREATE TABLE IF NOT EXISTS reward_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL COMMENT 'Icon name for mobile app',
    color VARCHAR(20) DEFAULT '#4CAF50',
    type ENUM('plan_upgrade', 'visibility_upgrade', 'badge', 'popular_searches', 'lottery', 'pickup_bonus') NOT NULL,
    required_referrals INT DEFAULT 0,
    reward_value JSON COMMENT '{"plan_id": 2} or {"visibility_ads": 2}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: referrals
-- Description: Tracks actual referrals made by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    referrer_id INT NOT NULL,
    referee_id INT NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_referral (referee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: user_rewards_progress
-- Description: Tracks user progress towards a reward
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_rewards_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_category_id INT NOT NULL,
    progress_count INT DEFAULT 0,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_category_id) REFERENCES reward_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: lottery_winners
-- Description: Stores historical lottery winners
-- ============================================================================
CREATE TABLE IF NOT EXISTS lottery_winners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: popular_searches
-- Description: Cache table for trending search terms
-- ============================================================================
CREATE TABLE IF NOT EXISTS popular_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query VARCHAR(255) NOT NULL,
    search_count INT DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_search_count (search_count)
);

SELECT 'Rewards system tables created successfully!' AS status;
`;

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Running rewards system migration...');
        await connection.query(migrationSQL);

        console.log('✅ Rewards system tables created successfully!');
        console.log('   - reward_categories');
        console.log('   - referrals');
        console.log('   - user_rewards_progress');
        console.log('   - lottery_winners');
        console.log('   - popular_searches');
        console.log('   - Updated users table (referral_code)');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        // Don't swallow the error, let it bubble up
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { runMigration };
