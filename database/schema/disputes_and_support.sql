-- ============================================
-- DISPUTES & SUPPORT SYSTEM DATABASE SCHEMA
-- Resolution Center & My Support Features
-- ============================================

-- ==========================================
-- 1. DISPUTES TABLES (Resolution Center)
-- ==========================================

-- Main disputes table
CREATE TABLE IF NOT EXISTS `disputes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_number` VARCHAR(20) UNIQUE NOT NULL,
  `user_id` INT NOT NULL,
  `advertisement_id` INT NOT NULL,
  `dispute_type` ENUM('buyer_initiated', 'seller_initiated', 'transaction_dispute', 'exchange', 'issue_negotiation') NOT NULL,
  `dispute_category` VARCHAR(100),
  `problem_description` TEXT,
  `status` ENUM('pending', 'under_review', 'awaiting_response', 'negotiation', 'resolved', 'closed', 'escalated') DEFAULT 'pending',
  `resolution_status` ENUM('accepted', 'rejected', 'in_negotiation', 'ended') DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `negotiation_deadline` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `closed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`advertisement_id`) REFERENCES `advertisements`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_disputes` (`user_id`, `status`),
  INDEX `idx_ad_disputes` (`advertisement_id`),
  INDEX `idx_dispute_number` (`dispute_number`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute messages/updates table
CREATE TABLE IF NOT EXISTS `dispute_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_admin_message` BOOLEAN DEFAULT FALSE,
  `is_system_message` BOOLEAN DEFAULT FALSE,
  `message_type` ENUM('text', 'status_update', 'resolution_offer', 'counteroffer') DEFAULT 'text',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_dispute_messages` (`dispute_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute evidence/attachments table
CREATE TABLE IF NOT EXISTS `dispute_evidence` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `file_type` ENUM('image', 'document', 'video', 'other') NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255),
  `file_size` INT,
  `description` TEXT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_dispute_evidence` (`dispute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute eligibility checks
CREATE TABLE IF NOT EXISTS `dispute_eligibility_checks` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_id` INT NOT NULL,
  `check_name` VARCHAR(100) NOT NULL,
  `check_result` ENUM('pass', 'fail', 'warning') NOT NULL,
  `is_eligible` BOOLEAN NOT NULL,
  `reason` TEXT,
  `checked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  INDEX `idx_dispute_eligibility` (`dispute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute resolutions/outcomes
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

-- ==========================================
-- 2. SUPPORT TICKETS TABLES (My Support)
-- ==========================================

-- Main support tickets table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ticket_number` VARCHAR(20) UNIQUE NOT NULL,
  `user_id` INT NOT NULL,
  `category` ENUM('deleted_ads', 'ad_appeal', 'general', 'technical', 'billing', 'account', 'other') NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `related_ad_id` INT NULL,
  `status` ENUM('open', 'in_progress', 'awaiting_user', 'resolved', 'closed') DEFAULT 'open',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `assigned_to` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_ad_id`) REFERENCES `advertisements`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_tickets` (`user_id`, `status`),
  INDEX `idx_ticket_number` (`ticket_number`),
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support ticket messages table
CREATE TABLE IF NOT EXISTS `support_ticket_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_staff_reply` BOOLEAN DEFAULT FALSE,
  `is_system_message` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticket_messages` (`ticket_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support ticket attachments table
CREATE TABLE IF NOT EXISTS `support_ticket_attachments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ticket_id` INT NOT NULL,
  `message_id` INT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255),
  `file_type` VARCHAR(50),
  `file_size` INT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`message_id`) REFERENCES `support_ticket_messages`(`id`) ON DELETE CASCADE,
  INDEX `idx_ticket_attachments` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. DELETED ADS TRACKING (for Appeals)
-- ==========================================

-- Track deleted advertisements for appeals
CREATE TABLE IF NOT EXISTS `deleted_advertisements` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `original_ad_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255),
  `category_id` INT,
  `price` DECIMAL(10, 2),
  `original_data` JSON,
  `deletion_reason` ENUM('user_request', 'policy_violation', 'expired', 'sold', 'admin_action', 'spam', 'inappropriate') NOT NULL,
  `deletion_reason_details` TEXT,
  `deleted_by` INT NULL,
  `deleted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `can_appeal` BOOLEAN DEFAULT TRUE,
  `appeal_deadline` TIMESTAMP NULL,
  `appeal_status` ENUM('not_appealed', 'pending', 'approved', 'rejected') DEFAULT 'not_appealed',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_deleted_ads` (`user_id`, `deleted_at`),
  INDEX `idx_original_ad` (`original_ad_id`),
  INDEX `idx_appeal_status` (`appeal_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. NOTIFICATIONS TABLES (for updates)
-- ==========================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` ENUM('dispute', 'support_ticket', 'appeal', 'system', 'message', 'offer', 'other') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `reference_type` VARCHAR(50),
  `reference_id` INT,
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_notifications` (`user_id`, `is_read`, `created_at`),
  INDEX `idx_reference` (`reference_type`, `reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to generate unique dispute number
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS generate_dispute_number()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(20);
  DECLARE counter INT;
  SET counter = (SELECT COALESCE(MAX(CAST(SUBSTRING(dispute_number, 5) AS UNSIGNED)), 0) + 1 FROM disputes);
  SET new_number = CONCAT('DIS', LPAD(counter, 8, '0'));
  RETURN new_number;
END$$
DELIMITER ;

-- Function to generate unique ticket number
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS generate_ticket_number()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(20);
  DECLARE counter INT;
  SET counter = (SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number, 4) AS UNSIGNED)), 0) + 1 FROM support_tickets);
  SET new_number = CONCAT('TKT', LPAD(counter, 8, '0'));
  RETURN new_number;
END$$
DELIMITER ;

-- ==========================================
-- 6. INITIAL DATA / SEED DATA (Optional)
-- ==========================================

-- Insert sample dispute categories
INSERT IGNORE INTO `dispute_eligibility_checks` (`dispute_id`, `check_name`, `check_result`, `is_eligible`, `reason`)
VALUES (0, 'sample', 'pass', TRUE, 'Sample eligibility check');

-- ==========================================
-- END OF SCHEMA
-- ==========================================