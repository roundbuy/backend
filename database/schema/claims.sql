-- Claims Table Schema
-- This table stores all claim records when disputes are escalated

CREATE TABLE IF NOT EXISTS `claims` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `claim_number` VARCHAR(20) UNIQUE NOT NULL,
  `dispute_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT 'Claimant (buyer)',
  `seller_id` INT NOT NULL COMMENT 'Respondent (seller)',
  `advertisement_id` INT NOT NULL,
  `claim_reason` TEXT NOT NULL COMMENT 'Why escalating to claim',
  `buyer_additional_evidence` TEXT COMMENT 'Additional evidence from buyer',
  `seller_response` TEXT COMMENT 'Seller response to claim',
  `admin_id` INT NULL COMMENT 'Assigned admin',
  `admin_decision` ENUM('favor_buyer', 'favor_seller', 'partial') NULL,
  `admin_notes` TEXT COMMENT 'Admin reasoning',
  `resolution_amount` DECIMAL(10,2) NULL COMMENT 'Refund amount',
  `status` ENUM('pending', 'under_review', 'resolved', 'closed') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` TIMESTAMP NULL,
  `resolved_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_claim_status` (`status`, `created_at`),
  INDEX `idx_claim_admin` (`admin_id`, `status`),
  INDEX `idx_claim_number` (`claim_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Claim Messages Table
CREATE TABLE IF NOT EXISTS `claim_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `claim_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_admin_message` BOOLEAN DEFAULT FALSE,
  `is_system_message` BOOLEAN DEFAULT FALSE,
  `message_type` ENUM('text', 'status_update', 'admin_decision', 'resolution') DEFAULT 'text',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_claim_messages` (`claim_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Claim Evidence Table
CREATE TABLE IF NOT EXISTS `claim_evidence` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `claim_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `file_type` ENUM('image', 'document', 'video', 'other') NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255),
  `file_size` INT,
  `description` TEXT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`claim_id`) REFERENCES `claims`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_claim_evidence` (`claim_id`, `uploaded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
