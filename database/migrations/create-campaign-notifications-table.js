/**
 * Campaign Notifications Migration
 * Creates tables for campaign notification system with 16 notification types
 * Supports automated triggers, manual sends, and scheduling
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
-- Table: campaign_notifications
-- Description: Stores 16 notification type definitions with dynamic content and styling
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_key VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique identifier (e.g., account_verified)',
    category ENUM('account', 'privacy', 'legal', 'feature', 'promotion', 'system') NOT NULL DEFAULT 'system',
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    
    -- Collapsed State Fields
    collapsed_icon VARCHAR(500) COMMENT 'Icon URL or icon name',
    collapsed_icon_bg_color VARCHAR(20) DEFAULT '#1E3A8A' COMMENT 'Hex color for icon background',
    collapsed_title VARCHAR(255) NOT NULL COMMENT 'Short title for collapsed state',
    collapsed_message TEXT COMMENT 'Brief message for collapsed state',
    collapsed_timestamp_text VARCHAR(50) COMMENT 'Optional timestamp text (e.g., "2min")',
    
    -- Expanded State Fields
    expanded_icon VARCHAR(500) COMMENT 'Icon URL or icon name (can reuse collapsed)',
    expanded_icon_bg_color VARCHAR(20) DEFAULT '#1E3A8A' COMMENT 'Hex color for icon background',
    expanded_title VARCHAR(255) COMMENT 'Title for expanded state (can reuse collapsed)',
    expanded_message TEXT COMMENT 'Longer message for expanded state',
    expanded_button_1_text VARCHAR(100) COMMENT 'First button text',
    expanded_button_1_action JSON COMMENT 'First button action {type, url/screen, params}',
    expanded_button_1_color VARCHAR(20) DEFAULT '#2563EB' COMMENT 'First button color',
    expanded_button_2_text VARCHAR(100) COMMENT 'Second button text (optional)',
    expanded_button_2_action JSON COMMENT 'Second button action',
    expanded_button_2_color VARCHAR(20) DEFAULT '#FFFFFF' COMMENT 'Second button color',
    
    -- Full-Screen Modal Fields
    fullscreen_show_logo BOOLEAN DEFAULT TRUE COMMENT 'Show RoundBuy logo',
    fullscreen_icon VARCHAR(500) COMMENT 'Icon URL or icon name',
    fullscreen_icon_bg_color VARCHAR(20) DEFAULT '#1E3A8A' COMMENT 'Hex color for icon background',
    fullscreen_heading VARCHAR(255) COMMENT 'Main heading',
    fullscreen_subheading VARCHAR(255) COMMENT 'Subheading',
    fullscreen_description TEXT COMMENT 'Full description with HTML support',
    fullscreen_primary_button_text VARCHAR(100) COMMENT 'Primary button text',
    fullscreen_primary_button_action JSON COMMENT 'Primary button action',
    fullscreen_primary_button_color VARCHAR(20) DEFAULT '#2563EB' COMMENT 'Primary button color',
    fullscreen_secondary_button_text VARCHAR(100) COMMENT 'Secondary button text (optional)',
    fullscreen_secondary_button_action JSON COMMENT 'Secondary button action',
    fullscreen_secondary_button_color VARCHAR(20) DEFAULT '#6B7280' COMMENT 'Secondary button color',
    
    -- Trigger Configuration
    trigger_type ENUM('one_time', 'recurring', 'manual', 'event') NOT NULL DEFAULT 'manual',
    trigger_conditions JSON COMMENT 'Conditions for automated triggers',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Enable/disable notification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_type_key (type_key),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Campaign notification type definitions with dynamic content and styling';

-- ============================================================================
-- Table: campaign_notification_triggers
-- Description: Tracks when each notification should be sent to users
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_notification_triggers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_notification_id INT NOT NULL COMMENT 'Reference to campaign_notifications',
    user_id INT NOT NULL COMMENT 'User to receive notification',
    
    trigger_status ENUM('pending', 'sent', 'cancelled', 'failed') DEFAULT 'pending',
    scheduled_at DATETIME NOT NULL COMMENT 'When to send notification',
    sent_at DATETIME DEFAULT NULL COMMENT 'When notification was actually sent',
    
    -- Recurring configuration
    is_recurring BOOLEAN DEFAULT FALSE COMMENT 'Is this a recurring notification',
    recurrence_pattern VARCHAR(50) COMMENT 'daily, weekly, monthly, etc.',
    next_occurrence_at DATETIME COMMENT 'Next scheduled occurrence for recurring',
    
    -- Metadata
    created_by INT COMMENT 'Admin who created this trigger (for manual sends)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (campaign_notification_id) REFERENCES campaign_notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_campaign_notification (campaign_notification_id),
    INDEX idx_user (user_id),
    INDEX idx_status (trigger_status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_sent_at (sent_at),
    INDEX idx_recurring (is_recurring),
    INDEX idx_next_occurrence (next_occurrence_at),
    INDEX idx_user_campaign (user_id, campaign_notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks scheduled and sent campaign notifications per user';

-- ============================================================================
-- Table: user_campaign_notifications
-- Description: Tracks delivery and engagement per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_campaign_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_notification_id INT NOT NULL COMMENT 'Reference to campaign_notifications',
    user_id INT NOT NULL COMMENT 'User who received notification',
    trigger_id INT COMMENT 'Reference to trigger that sent this',
    
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Has user read the notification',
    is_clicked BOOLEAN DEFAULT FALSE COMMENT 'Has user clicked the notification',
    is_dismissed BOOLEAN DEFAULT FALSE COMMENT 'Has user dismissed the notification',
    
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When notification was delivered',
    read_at DATETIME DEFAULT NULL COMMENT 'When user marked as read',
    clicked_at DATETIME DEFAULT NULL COMMENT 'When user clicked notification',
    dismissed_at DATETIME DEFAULT NULL COMMENT 'When user dismissed notification',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (campaign_notification_id) REFERENCES campaign_notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trigger_id) REFERENCES campaign_notification_triggers(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_campaign_notification (campaign_notification_id),
    INDEX idx_user (user_id),
    INDEX idx_trigger (trigger_id),
    INDEX idx_is_read (is_read),
    INDEX idx_is_clicked (is_clicked),
    INDEX idx_is_dismissed (is_dismissed),
    INDEX idx_delivered_at (delivered_at),
    
    -- Prevent duplicate notifications
    UNIQUE KEY unique_user_campaign (user_id, campaign_notification_id, trigger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks campaign notification delivery and engagement per user';

-- ============================================================================
-- Success Message
-- ============================================================================
SELECT 'Campaign notification tables created successfully!' AS status;
`;

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Running campaign notifications migration...');
        await connection.query(migrationSQL);

        console.log('✅ Campaign notification tables created successfully!');
        console.log('   - campaign_notifications');
        console.log('   - campaign_notification_triggers');
        console.log('   - user_campaign_notifications');

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
