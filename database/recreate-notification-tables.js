/**
 * Recreate Notification Tables with Updated Schema
 * This will drop existing tables and create new ones with all features
 */

const { promisePool } = require('../src/config/database');

async function recreateTables() {
    console.log('🔄 Recreating notification tables with updated schema...\n');
    console.log('⚠️  WARNING: This will drop existing notification tables!\n');

    try {
        // Drop existing tables in correct order (foreign keys)
        console.log('⏳ Dropping existing tables...');

        await promisePool.query('DROP TABLE IF EXISTS notification_heartbeat_log');
        await promisePool.query('DROP TABLE IF EXISTS user_notifications');
        await promisePool.query('DROP TABLE IF EXISTS user_device_tokens');
        await promisePool.query('DROP TABLE IF EXISTS notifications');

        console.log('✅ Old tables dropped\n');

        // Create notifications table with all new features
        console.log('⏳ Creating notifications table...');

        await promisePool.query(`
      CREATE TABLE notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL COMMENT 'Notification title',
        message TEXT NOT NULL COMMENT 'Notification message body',
        type ENUM('push', 'popup', 'fullscreen') NOT NULL DEFAULT 'push' COMMENT 'Notification display type',
        priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' COMMENT 'Notification priority level',
        
        target_audience ENUM('all', 'all_users', 'all_guests', 'specific_users', 'condition') NOT NULL DEFAULT 'all' COMMENT 'Target audience type',
        target_user_ids JSON COMMENT 'Array of user IDs if target_audience is specific_users',
        target_conditions JSON COMMENT 'Conditions: {subscription_plan: [1,2], country: ["IND"], is_verified: true}',
        
        image_url VARCHAR(500) COMMENT 'Optional notification image URL',
        action_type ENUM('none', 'open_url', 'open_screen', 'custom') DEFAULT 'none' COMMENT 'Action when clicked',
        action_data JSON COMMENT 'Additional data for action',
        
        scheduled_at DATETIME DEFAULT NULL COMMENT 'When to send (NULL for immediate)',
        sent_at DATETIME DEFAULT NULL COMMENT 'When actually sent',
        expires_at DATETIME DEFAULT NULL COMMENT 'When notification expires',
        
        created_by INT NOT NULL COMMENT 'Admin user ID',
        is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete flag',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_type (type),
        INDEX idx_priority (priority),
        INDEX idx_target_audience (target_audience),
        INDEX idx_scheduled_at (scheduled_at),
        INDEX idx_sent_at (sent_at),
        INDEX idx_expires_at (expires_at),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ notifications table created\n');

        // Create user_notifications table
        console.log('⏳ Creating user_notifications table...');

        await promisePool.query(`
      CREATE TABLE user_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        notification_id INT NOT NULL,
        user_id INT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_clicked BOOLEAN DEFAULT FALSE,
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME DEFAULT NULL,
        clicked_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_notification_id (notification_id),
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_user_read (user_id, is_read),
        
        UNIQUE KEY unique_user_notification (user_id, notification_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ user_notifications table created\n');

        // Create user_device_tokens table (supports guests)
        console.log('⏳ Creating user_device_tokens table...');

        await promisePool.query(`
      CREATE TABLE user_device_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL COMMENT 'NULL for guest users',
        device_token VARCHAR(500) NOT NULL,
        platform ENUM('ios', 'android', 'web') NOT NULL,
        device_name VARCHAR(255),
        device_id VARCHAR(255) COMMENT 'Unique device ID for guests',
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_user_id (user_id),
        INDEX idx_device_token (device_token(255)),
        INDEX idx_device_id (device_id),
        INDEX idx_platform (platform),
        INDEX idx_is_active (is_active),
        
        UNIQUE KEY unique_device_token (device_token(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ user_device_tokens table created\n');

        // Create notification_heartbeat_log table
        console.log('⏳ Creating notification_heartbeat_log table...');

        await promisePool.query(`
      CREATE TABLE notification_heartbeat_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        device_id VARCHAR(255),
        last_check_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_user_id (user_id),
        INDEX idx_device_id (device_id),
        INDEX idx_last_check_at (last_check_at),
        
        UNIQUE KEY unique_user_device (user_id, device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ notification_heartbeat_log table created\n');

        // Verify
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

        console.log('\n🎉 Tables recreated successfully!\n');
        console.log('📋 New Features:');
        console.log('   ✓ Guest user support (no login required)');
        console.log('   ✓ Advanced targeting with conditions');
        console.log('   ✓ Notification expiration');
        console.log('   ✓ Heartbeat polling for real-time popups\n');

    } catch (error) {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    } finally {
        await promisePool.end();
    }
}

recreateTables();
