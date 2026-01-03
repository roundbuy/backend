-- Updated Notification Center Tables Migration
-- Created: 2025-12-29
-- Description: Supports guest users, advanced targeting conditions, and heartbeat polling

-- ============================================================================
-- Table: notifications (UPDATED)
-- Description: Stores admin-created notifications with advanced targeting
-- ============================================================================
DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Notification title',
    message TEXT NOT NULL COMMENT 'Notification message body',
    type ENUM('push', 'popup', 'fullscreen') NOT NULL DEFAULT 'push' COMMENT 'Notification display type',
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' COMMENT 'Notification priority level',
    
    -- Advanced Targeting
    target_audience ENUM('all', 'all_users', 'all_guests', 'specific_users', 'condition') NOT NULL DEFAULT 'all' COMMENT 'Target audience type',
    target_user_ids JSON COMMENT 'Array of user IDs if target_audience is specific_users',
    target_conditions JSON COMMENT 'Conditions for targeting: {subscription_plan: [1,2], country: ["IND"], is_verified: true, etc.}',
    
    -- Content
    image_url VARCHAR(500) COMMENT 'Optional notification image URL',
    action_type ENUM('none', 'open_url', 'open_screen', 'custom') DEFAULT 'none' COMMENT 'Action when notification is clicked',
    action_data JSON COMMENT 'Additional data for action (URL, screen name, custom data)',
    
    -- Scheduling
    scheduled_at DATETIME DEFAULT NULL COMMENT 'When to send notification (NULL for immediate)',
    sent_at DATETIME DEFAULT NULL COMMENT 'When notification was actually sent',
    expires_at DATETIME DEFAULT NULL COMMENT 'When notification expires (for heartbeat polling)',
    
    -- Metadata
    created_by INT NOT NULL COMMENT 'Admin user ID who created the notification',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete flag',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_target_audience (target_audience),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_sent_at (sent_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Admin-created notifications with advanced targeting and heartbeat support';

-- ============================================================================
-- Table: user_notifications (UPDATED)
-- Description: Tracks notification delivery and engagement per user (logged in users only)
-- ============================================================================
CREATE TABLE user_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL COMMENT 'Reference to notifications table',
    user_id INT NOT NULL COMMENT 'User who received the notification',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Whether user has read the notification',
    is_clicked BOOLEAN DEFAULT FALSE COMMENT 'Whether user has clicked the notification',
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When notification was delivered to user',
    read_at DATETIME DEFAULT NULL COMMENT 'When user marked as read',
    clicked_at DATETIME DEFAULT NULL COMMENT 'When user clicked the notification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_notification_id (notification_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_is_clicked (is_clicked),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_delivered_at (delivered_at),
    
    -- Ensure one notification per user (no duplicates)
    UNIQUE KEY unique_user_notification (user_id, notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks notification delivery and engagement metrics per logged-in user';

-- ============================================================================
-- Table: user_device_tokens (UPDATED)
-- Description: Stores FCM device tokens for both logged-in users and guests
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL COMMENT 'User ID if logged in, NULL for guest users',
    device_token VARCHAR(500) NOT NULL COMMENT 'FCM/Expo push token',
    platform ENUM('ios', 'android', 'web') NOT NULL COMMENT 'Device platform',
    device_name VARCHAR(255) COMMENT 'Optional device name (e.g., iPhone 13, Pixel 6)',
    device_id VARCHAR(255) COMMENT 'Unique device identifier for guest users',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether token is still valid',
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last time token was used',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys (nullable for guest users)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_device_token (device_token(255)),
    INDEX idx_device_id (device_id),
    INDEX idx_platform (platform),
    INDEX idx_is_active (is_active),
    INDEX idx_last_used_at (last_used_at),
    
    -- Ensure one token per device (works for both users and guests)
    UNIQUE KEY unique_device_token (device_token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores device tokens for both logged-in users and guest users';

-- ============================================================================
-- Table: notification_heartbeat_log (NEW)
-- Description: Tracks when users/guests last checked for notifications (for polling)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_heartbeat_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT NULL COMMENT 'User ID if logged in, NULL for guest',
    device_id VARCHAR(255) COMMENT 'Device identifier for guests',
    last_check_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last time checked for notifications',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys (nullable for guests)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_device_id (device_id),
    INDEX idx_last_check_at (last_check_at),
    
    -- One record per user or device
    UNIQUE KEY unique_user_device (user_id, device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks heartbeat polling for new notifications';

-- ============================================================================
-- Success Message
-- ============================================================================
SELECT 'Updated notification tables created successfully!' AS status;
