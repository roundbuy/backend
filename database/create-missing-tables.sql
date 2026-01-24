-- Missing Tables SQL Script
-- These tables are defined in schema files but not created in the database
-- Run this to create the missing tables

-- 1. API Logs Table
CREATE TABLE IF NOT EXISTS `api_logs` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `endpoint` VARCHAR(255) NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `request_body` JSON,
  `response_body` JSON,
  `status_code` INT NOT NULL,
  `response_time_ms` INT,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `error_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_endpoint` (`endpoint`),
  INDEX `idx_method` (`method`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status_code` (`status_code`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Banner Plans Table
CREATE TABLE IF NOT EXISTS `banner_plans` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `duration_days` INT NOT NULL DEFAULT 30,
  `placement` ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
  `dimensions` JSON COMMENT '{"width": 1200, "height": 300}',
  `allowed_for_subscription_ids` JSON COMMENT 'Array of subscription plan IDs',
  `max_clicks` INT DEFAULT NULL COMMENT 'Max clicks allowed, NULL for unlimited',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_placement` (`placement`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Banners Table
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `banner_plan_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `link_url` VARCHAR(500),
  `placement` ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
  `status` ENUM('draft', 'pending', 'approved', 'published', 'expired', 'rejected') DEFAULT 'draft',
  `impressions_count` INT DEFAULT 0,
  `clicks_count` INT DEFAULT 0,
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`banner_plan_id`) REFERENCES `banner_plans`(`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_placement` (`placement`),
  INDEX `idx_status` (`status`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Dispute Resolutions Table
CREATE TABLE IF NOT EXISTS `dispute_resolutions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_id` INT NOT NULL,
  `resolution_type` ENUM('refund', 'replacement', 'partial_refund', 'no_action', 'other') NOT NULL,
  `resolution_amount` DECIMAL(10, 2) DEFAULT NULL,
  `resolution_details` TEXT,
  `resolved_by` INT NULL,
  `resolved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_dispute_resolutions` (`dispute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Moderation Queue Table
CREATE TABLE IF NOT EXISTS `moderation_queue` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `content_type` ENUM('advertisement', 'banner', 'product', 'review', 'message', 'user_profile') NOT NULL,
  `content_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `flagged_words` JSON COMMENT 'Array of flagged words found',
  `flagged_reason` TEXT,
  `status` ENUM('pending', 'approved', 'rejected', 'escalated') DEFAULT 'pending',
  `reviewed_by_admin_id` INT DEFAULT NULL,
  `review_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_content_type` (`content_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Moderation Words Table
CREATE TABLE IF NOT EXISTS `moderation_words` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `word` VARCHAR(255) NOT NULL,
  `category` ENUM('offensive', 'spam', 'inappropriate', 'prohibited') DEFAULT 'inappropriate',
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_word` (`word`),
  INDEX `idx_category` (`category`),
  INDEX `idx_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default moderation words
INSERT INTO `moderation_words` (`word`, `category`, `severity`) VALUES
('spam', 'spam', 'medium'),
('scam', 'prohibited', 'high'),
('fake', 'inappropriate', 'medium'),
('fraud', 'prohibited', 'critical');

-- 7. Translation Keys Table
CREATE TABLE IF NOT EXISTS `translation_keys` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `key_name` VARCHAR(255) UNIQUE NOT NULL COMMENT 'e.g., home.welcome, auth.login',
  `category` VARCHAR(50) NOT NULL COMMENT 'general, auth, products, etc.',
  `default_text` TEXT NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_key_name` (`key_name`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Translations Table
CREATE TABLE IF NOT EXISTS `translations` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `translation_key_id` INT NOT NULL,
  `language_id` INT NOT NULL,
  `translated_text` TEXT NOT NULL,
  `is_auto_translated` BOOLEAN DEFAULT FALSE,
  `modified_by_admin_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`translation_key_id`) REFERENCES `translation_keys`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`modified_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_translation` (`translation_key_id`, `language_id`),
  INDEX `idx_language_id` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification Query
SELECT 
  'api_logs' as table_name, COUNT(*) as exists_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_logs'
UNION ALL
SELECT 'banner_plans', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banner_plans'
UNION ALL
SELECT 'banners', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners'
UNION ALL
SELECT 'dispute_resolutions', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dispute_resolutions'
UNION ALL
SELECT 'moderation_queue', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'moderation_queue'
UNION ALL
SELECT 'moderation_words', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'moderation_words'
UNION ALL
SELECT 'translation_keys', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'translation_keys'
UNION ALL
SELECT 'translations', COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'translations';
