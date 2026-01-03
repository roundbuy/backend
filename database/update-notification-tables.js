/**
 * Update Notification Tables Migration
 * Adds support for guest users, advanced targeting, and heartbeat polling
 */

const { promisePool } = require('../src/config/database');

async function updateTables() {
    console.log('🔄 Updating notification tables for guest users and advanced features...\n');

    try {
        // Update notifications table
        console.log('⏳ Updating notifications table...');

        await promisePool.query(`
      ALTER TABLE notifications
      MODIFY COLUMN target_audience ENUM('all', 'all_users', 'all_guests', 'specific_users', 'condition') NOT NULL DEFAULT 'all'
      COMMENT 'Target audience type'
    `);

        await promisePool.query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS target_conditions JSON COMMENT 'Conditions for targeting' AFTER target_user_ids
    `);

        await promisePool.query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS expires_at DATETIME DEFAULT NULL COMMENT 'When notification expires' AFTER sent_at
    `);

        console.log('✅ notifications table updated\n');

        // Update user_device_tokens table
        console.log('⏳ Updating user_device_tokens table...');

        await promisePool.query(`
      ALTER TABLE user_device_tokens
      MODIFY COLUMN user_id INT DEFAULT NULL COMMENT 'User ID if logged in, NULL for guests'
    `);

        await promisePool.query(`
      ALTER TABLE user_device_tokens
      ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) COMMENT 'Unique device identifier for guests' AFTER device_name
    `);

        await promisePool.query(`
      ALTER TABLE user_device_tokens
      ADD INDEX IF NOT EXISTS idx_device_id (device_id)
    `);

        // Drop old unique constraint if exists and add new one
        try {
            await promisePool.query(`
        ALTER TABLE user_device_tokens
        DROP INDEX unique_user_device
      `);
        } catch (e) {
            // Index might not exist, that's okay
        }

        await promisePool.query(`
      ALTER TABLE user_device_tokens
      ADD UNIQUE KEY unique_device_token (device_token(255))
    `);

        console.log('✅ user_device_tokens table updated\n');

        // Create notification_heartbeat_log table
        console.log('⏳ Creating notification_heartbeat_log table...');

        await promisePool.query(`
      CREATE TABLE IF NOT EXISTS notification_heartbeat_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL COMMENT 'User ID if logged in, NULL for guest',
        device_id VARCHAR(255) COMMENT 'Device identifier for guests',
        last_check_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last time checked for notifications',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_user_id (user_id),
        INDEX idx_device_id (device_id),
        INDEX idx_last_check_at (last_check_at),
        
        UNIQUE KEY unique_user_device (user_id, device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Tracks heartbeat polling for new notifications'
    `);

        console.log('✅ notification_heartbeat_log table created\n');

        // Verify all tables
        console.log('🔍 Verifying updated tables...\n');

        const [tables] = await promisePool.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('notifications', 'user_notifications', 'user_device_tokens', 'notification_heartbeat_log')
      ORDER BY TABLE_NAME
    `);

        console.log('✅ All tables verified:\n');
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME} (${table.TABLE_ROWS} rows)`);
        });

        console.log('\n🎉 Update completed successfully!\n');
        console.log('📋 New Features Enabled:');
        console.log('   ✓ Guest user support (FCM tokens without login)');
        console.log('   ✓ Advanced targeting conditions');
        console.log('   ✓ Notification expiration');
        console.log('   ✓ Heartbeat polling for real-time popups\n');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await promisePool.end();
    }
}

updateTables();
