-- ============================================
-- ISSUE SYSTEM DATABASE MIGRATION
-- Version: 1.0
-- Date: 2026-01-01
-- SAFE TO RUN MULTIPLE TIMES
-- ============================================

-- Set safe mode
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- DROP EXISTING TABLES (IF THEY EXIST)
-- ==========================================

DROP TABLE IF EXISTS `issue_messages`;
DROP TABLE IF EXISTS `issue_evidence`;
DROP TABLE IF EXISTS `issues`;

-- Remove column from disputes if it exists
SET @dbname = DATABASE();
SET @tablename = 'disputes';
SET @columnname = 'escalated_from_issue_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN ', @columnname, ';'),
  'SELECT 1;'
));
PREPARE alterStatement FROM @preparedStatement;
EXECUTE alterStatement;
DEALLOCATE PREPARE alterStatement;

-- ==========================================
-- 1. CREATE ISSUES TABLE
-- ==========================================

CREATE TABLE `issues` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `issue_number` VARCHAR(20) UNIQUE NOT NULL,
  `advertisement_id` INT NOT NULL,
  `product_name` VARCHAR(255),
  `created_by` INT NOT NULL COMMENT 'Buyer ID',
  `other_party_id` INT NOT NULL COMMENT 'Seller ID',
  `issue_type` ENUM(
    'quality',
    'delivery',
    'description_mismatch',
    'price',
    'exchange',
    'other'
  ) NOT NULL,
  `issue_description` TEXT NOT NULL,
  `buyer_request` TEXT COMMENT 'What buyer wants',
  `seller_response_text` TEXT COMMENT 'Seller response message',
  `seller_decision` ENUM('accept', 'decline', 'pending') DEFAULT 'pending',
  `status` ENUM(
    'open',
    'seller_responded',
    'closed_by_buyer',
    'settled',
    'escalated_to_dispute'
  ) DEFAULT 'open',
  `deadline` TIMESTAMP NULL COMMENT '3 days from creation',
  `responded_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_issue_number` (`issue_number`),
  INDEX `idx_issue_status` (`status`, `created_at`),
  INDEX `idx_issue_parties` (`created_by`, `other_party_id`),
  INDEX `idx_issue_ad` (`advertisement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. CREATE ISSUE EVIDENCE TABLE
-- ==========================================

CREATE TABLE `issue_evidence` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `issue_id` INT NOT NULL,
  `uploaded_by` INT NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_type` ENUM('pdf', 'image') NOT NULL,
  `file_size` INT NOT NULL COMMENT 'Size in bytes',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  INDEX `idx_issue_evidence` (`issue_id`),
  INDEX `idx_evidence_uploader` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. CREATE ISSUE MESSAGES TABLE
-- ==========================================

CREATE TABLE `issue_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `issue_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_system_message` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE,
  INDEX `idx_issue_messages` (`issue_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. UPDATE DISPUTES TABLE
-- ==========================================

-- Add column to link disputes to issues (if disputes table exists)
SET @dbname = DATABASE();
SET @tablename = 'disputes';
SET @columnname = 'escalated_from_issue_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL AFTER id;'),
  'SELECT 1;'
));
PREPARE alterStatement FROM @preparedStatement;
EXECUTE alterStatement;
DEALLOCATE PREPARE alterStatement;

-- Add foreign key if disputes table exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' ADD FOREIGN KEY (', @columnname, ') REFERENCES issues(id) ON DELETE SET NULL;'),
  'SELECT 1;'
));
PREPARE alterStatement FROM @preparedStatement;
EXECUTE alterStatement;
DEALLOCATE PREPARE alterStatement;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 5. VERIFICATION QUERIES
-- ==========================================

-- Check if tables were created
SELECT 
  'Tables Created' as Status,
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('issues', 'issue_evidence', 'issue_messages')
ORDER BY TABLE_NAME;

-- Check if foreign keys were created
SELECT 
  'Foreign Keys' as Status,
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME,
  COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('issues', 'issue_evidence', 'issue_messages')
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- ==========================================
-- 6. INSERT SAMPLE DATA (OPTIONAL)
-- ==========================================

-- Uncomment below to insert sample data for testing

/*
-- Sample issue (replace user IDs and ad ID with real ones)
INSERT INTO issues (
  issue_number,
  advertisement_id,
  product_name,
  created_by,
  other_party_id,
  issue_type,
  issue_description,
  deadline,
  status
) VALUES (
  'ISS00001',
  1,
  'Coffee Maker',
  1,
  2,
  'quality',
  'The coffee maker arrived damaged. The glass carafe is cracked.',
  DATE_ADD(NOW(), INTERVAL 3 DAY),
  'open'
);

-- Sample system message
INSERT INTO issue_messages (
  issue_id,
  sender_id,
  message,
  is_system_message
) VALUES (
  1,
  1,
  'Issue ISS00001 created. Seller has 3 days to respond.',
  TRUE
);
*/

-- ==========================================
-- END OF MIGRATION
-- ==========================================

SELECT '✅ Migration completed successfully!' as Status;
