/**
 * Add User Tracking Fields Migration
 * Adds fields to users table for tracking behavior needed for campaign notification triggers
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
-- Add User Tracking Fields
-- ============================================================================

-- Check and add login_count if not exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'login_count'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE users ADD COLUMN login_count INT DEFAULT 0 COMMENT "Number of times user has logged in"',
    'SELECT "Column login_count already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add first_login_at if not exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'first_login_at'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE users ADD COLUMN first_login_at TIMESTAMP NULL COMMENT "When user first logged in"',
    'SELECT "Column first_login_at already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_verified_at if not exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'email_verified_at'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL COMMENT "When email was verified"',
    'SELECT "Column email_verified_at already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_login_count (login_count),
ADD INDEX IF NOT EXISTS idx_first_login_at (first_login_at),
ADD INDEX IF NOT EXISTS idx_email_verified_at (email_verified_at);

-- ============================================================================
-- Success Message
-- ============================================================================
SELECT 'User tracking fields added successfully!' AS status;
`;

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Adding user tracking fields...');
        await connection.query(migrationSQL);

        console.log('✅ User tracking fields added successfully!');
        console.log('   - login_count');
        console.log('   - first_login_at');
        console.log('   - email_verified_at');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
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
