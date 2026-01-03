-- ============================================
-- RESOLUTION & SUPPORT SYSTEM - PHASE 1 UPDATES
-- Issue Flow & Deadline Management
-- ============================================

-- ==========================================
-- 1. CREATE ISSUES TABLE
-- ==========================================

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
  FOREIGN KEY (`escalated_dispute_id`) REFERENCES `disputes`(`id`) ON DELETE SET NULL,
  INDEX `idx_created_by` (`created_by`, `status`),
  INDEX `idx_other_party` (`other_party_id`, `status`),
  INDEX `idx_issue_number` (`issue_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_deadline` (`issue_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. UPDATE DISPUTES TABLE - ADD DEADLINE FIELDS
-- ==========================================

ALTER TABLE `disputes` 
ADD COLUMN IF NOT EXISTS `issue_id` INT NULL AFTER `advertisement_id`,
ADD COLUMN IF NOT EXISTS `dispute_deadline` TIMESTAMP NULL AFTER `negotiation_deadline`,
ADD COLUMN IF NOT EXISTS `claim_deadline` TIMESTAMP NULL AFTER `dispute_deadline`,
ADD COLUMN IF NOT EXISTS `resolution_deadline` TIMESTAMP NULL AFTER `claim_deadline`,
ADD COLUMN IF NOT EXISTS `current_phase` ENUM('issue', 'dispute', 'claim', 'resolution', 'ended') DEFAULT 'dispute' AFTER `resolution_status`,
ADD FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE SET NULL;

-- Add index for phase and deadlines
ALTER TABLE `disputes`
ADD INDEX IF NOT EXISTS `idx_current_phase` (`current_phase`),
ADD INDEX IF NOT EXISTS `idx_dispute_deadline` (`dispute_deadline`),
ADD INDEX IF NOT EXISTS `idx_claim_deadline` (`claim_deadline`),
ADD INDEX IF NOT EXISTS `idx_resolution_deadline` (`resolution_deadline`);

-- ==========================================
-- 3. CREATE DISPUTE CLAIMS TABLE
-- ==========================================

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

-- ==========================================
-- 4. CREATE ISSUE MESSAGES TABLE
-- ==========================================

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

-- ==========================================
-- 5. UPDATE NOTIFICATIONS TABLE
-- ==========================================

-- Add new notification types
ALTER TABLE `notifications` 
MODIFY COLUMN `type` ENUM(
  'issue', 'issue_accepted', 'issue_rejected', 'issue_deadline',
  'dispute', 'dispute_deadline', 'dispute_escalated',
  'claim', 'claim_deadline', 'claim_answered',
  'resolution', 'resolution_deadline', 'resolution_agreed',
  'support_ticket', 'appeal', 'system', 'message', 'offer', 'other'
) NOT NULL;

-- ==========================================
-- 6. CREATE FUNCTION TO GENERATE ISSUE NUMBER
-- ==========================================

DROP FUNCTION IF EXISTS generate_issue_number;

DELIMITER $$
CREATE FUNCTION generate_issue_number()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE new_number VARCHAR(20);
  DECLARE counter INT;
  SET counter = (SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number, 4) AS UNSIGNED)), 0) + 1 FROM issues);
  SET new_number = CONCAT('ISS', LPAD(counter, 8, '0'));
  RETURN new_number;
END$$
DELIMITER ;

-- ==========================================
-- 7. CREATE STORED PROCEDURE FOR DEADLINE CALCULATION
-- ==========================================

DROP PROCEDURE IF EXISTS calculate_uk_deadline;

DELIMITER $$
CREATE PROCEDURE calculate_uk_deadline(
  IN days_to_add INT,
  OUT deadline_timestamp TIMESTAMP
)
BEGIN
  -- Calculate deadline: X days from now at 00:00 UK time
  -- Note: This is a simplified version. In production, you'd need to handle BST/GMT properly
  SET deadline_timestamp = DATE_ADD(
    DATE_ADD(CURDATE(), INTERVAL days_to_add DAY),
    INTERVAL 0 HOUR
  );
END$$
DELIMITER ;

-- ==========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Optimize queries for deadline checking
CREATE INDEX IF NOT EXISTS idx_issues_pending_deadline 
ON issues(status, issue_deadline) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_disputes_phase_deadline 
ON disputes(current_phase, dispute_deadline, claim_deadline, resolution_deadline);

-- ==========================================
-- 9. ADD TRIGGERS FOR AUTO-UPDATES
-- ==========================================

-- Trigger to update dispute phase when claim is created
DROP TRIGGER IF EXISTS after_claim_insert;

DELIMITER $$
CREATE TRIGGER after_claim_insert
AFTER INSERT ON dispute_claims
FOR EACH ROW
BEGIN
  UPDATE disputes 
  SET current_phase = 'claim',
      claim_deadline = NEW.claim_deadline
  WHERE id = NEW.dispute_id;
END$$
DELIMITER ;

-- Trigger to update issue status when escalated
DROP TRIGGER IF EXISTS after_issue_escalate;

DELIMITER $$
CREATE TRIGGER after_issue_escalate
AFTER UPDATE ON issues
FOR EACH ROW
BEGIN
  IF NEW.status = 'escalated' AND OLD.status != 'escalated' THEN
    SET NEW.escalated_at = NOW();
  END IF;
END$$
DELIMITER ;

-- ==========================================
-- 10. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ==========================================

-- Insert sample issue types for reference
-- (Commented out - uncomment if needed for testing)

/*
INSERT INTO issues (
  issue_number, created_by, other_party_id, advertisement_id,
  issue_type, issue_description, issue_deadline
) VALUES (
  'ISS00000001', 1, 2, 1,
  'quality', 'Item received is not as described in the listing',
  DATE_ADD(NOW(), INTERVAL 3 DAY)
);
*/

-- ==========================================
-- END OF SCHEMA UPDATES
-- ==========================================

-- Verify tables were created
SELECT 'Schema update completed successfully!' AS status;
SELECT COUNT(*) as issues_table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'issues';
SELECT COUNT(*) as claims_table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'dispute_claims';
