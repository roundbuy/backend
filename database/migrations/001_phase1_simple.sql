-- ============================================
-- RESOLUTION & SUPPORT SYSTEM - PHASE 1 (SIMPLIFIED)
-- Issue Flow & Deadline Management
-- ============================================

-- 1. CREATE ISSUES TABLE
CREATE TABLE IF NOT EXISTS `issues` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `issue_number` VARCHAR(20) UNIQUE NOT NULL,
  `created_by` INT NOT NULL,
  `other_party_id` INT NOT NULL,
  `advertisement_id` INT NOT NULL,
  `issue_type` ENUM('exchange', 'quality', 'delivery', 'price', 'description_mismatch', 'other') NOT NULL,
  `issue_description` TEXT NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected', 'escalated', 'expired') DEFAULT 'pending',
  `issue_deadline` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `accepted_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL,
  `escalated_at` TIMESTAMP NULL,
  `escalated_dispute_id` INT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`other_party_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`advertisement_id`) REFERENCES `advertisements`(`id`) ON DELETE CASCADE,
  INDEX `idx_created_by` (`created_by`, `status`),
  INDEX `idx_other_party` (`other_party_id`, `status`),
  INDEX `idx_issue_number` (`issue_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_deadline` (`issue_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CREATE ISSUE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS `issue_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `issue_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_system_message` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_issue_messages` (`issue_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CREATE DISPUTE CLAIMS TABLE
CREATE TABLE IF NOT EXISTS `dispute_claims` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dispute_id` INT NOT NULL,
  `created_by` INT NOT NULL,
  `claim_description` TEXT NOT NULL,
  `claim_deadline` TIMESTAMP NOT NULL,
  `buyer_id` INT NOT NULL,
  `seller_id` INT NOT NULL,
  `buyer_answered` BOOLEAN DEFAULT FALSE,
  `seller_answered` BOOLEAN DEFAULT FALSE,
  `buyer_answer` TEXT NULL,
  `seller_answer` TEXT NULL,
  `buyer_answer_submitted_at` TIMESTAMP NULL,
  `seller_answer_submitted_at` TIMESTAMP NULL,
  `buyer_evidence` JSON NULL,
  `seller_evidence` JSON NULL,
  `winner_id` INT NULL,
  `status` ENUM('pending', 'answered', 'resolved', 'expired') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_dispute_claim` (`dispute_id`),
  INDEX `idx_claim_deadline` (`claim_deadline`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. UPDATE DISPUTES TABLE - ADD DEADLINE FIELDS
ALTER TABLE `disputes` 
ADD COLUMN `issue_id` INT NULL AFTER `advertisement_id`,
ADD COLUMN `dispute_deadline` TIMESTAMP NULL AFTER `negotiation_deadline`,
ADD COLUMN `claim_deadline` TIMESTAMP NULL AFTER `dispute_deadline`,
ADD COLUMN `resolution_deadline` TIMESTAMP NULL AFTER `claim_deadline`,
ADD COLUMN `current_phase` ENUM('issue', 'dispute', 'claim', 'resolution', 'ended') DEFAULT 'dispute' AFTER `resolution_status`;

-- 5. ADD FOREIGN KEY FOR ISSUE_ID
ALTER TABLE `disputes`
ADD CONSTRAINT `fk_disputes_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE SET NULL;

-- 6. ADD INDEXES FOR PERFORMANCE
ALTER TABLE `disputes`
ADD INDEX `idx_current_phase` (`current_phase`),
ADD INDEX `idx_dispute_deadline` (`dispute_deadline`),
ADD INDEX `idx_claim_deadline` (`claim_deadline`),
ADD INDEX `idx_resolution_deadline` (`resolution_deadline`);

SELECT 'Phase 1 migration completed successfully!' AS status;
