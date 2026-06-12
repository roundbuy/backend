const { promisePool } = require('../src/config/database');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🚀 Starting Social Login Migration...');

    // 1. Make password_hash nullable
    console.log('🔧 Making password_hash nullable...');
    await promisePool.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL');

    // 2. Add social columns to users table
    console.log('🔧 Adding social_provider and social_id columns...');
    try {
      await promisePool.query(`
        ALTER TABLE users 
        ADD COLUMN social_provider ENUM('google', 'apple', 'instagram') NULL AFTER password_hash,
        ADD COLUMN social_id VARCHAR(255) NULL AFTER social_provider
      `);
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('ℹ️ Social columns already exist.');
      } else {
        throw err;
      }
    }

    // 3. Add index for social login
    console.log('🔧 Adding index for social login...');
    try {
      await promisePool.query('CREATE INDEX idx_users_social ON users (social_provider, social_id)');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Social index already exists.');
      } else {
        throw err;
      }
    }

    // 4. Create user_social_accounts table
    console.log('🔧 Creating user_social_accounts table...');
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS user_social_accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        provider ENUM('google', 'apple', 'instagram') NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        access_token TEXT NULL,
        refresh_token TEXT NULL,
        token_expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_account (provider, provider_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
