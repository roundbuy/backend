-- Admin Panel Database Migrations
-- Run this to add admin functionality to the database

-- 1. Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role ENUM('user', 'support_staff', 'moderator', 'admin', 'super_admin') 
DEFAULT 'user' 
AFTER email;

-- 2. Add last_login column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL 
AFTER role;

-- 3. Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Add assigned_to column to disputes table
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS assigned_to INT NULL 
AFTER priority;

-- Add foreign key for assigned_to (only if column was just created)
-- Check if foreign key exists first
SET @fk_exists = (SELECT COUNT(*) 
                  FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'disputes'
                  AND CONSTRAINT_NAME = 'fk_disputes_assigned_to');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE disputes ADD CONSTRAINT fk_disputes_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Create an initial super admin user (optional - update with your details)
-- Password: 'admin123' (hashed with bcrypt)
-- IMPORTANT: Change this password immediately after first login!

INSERT IGNORE INTO users (email, password, full_name, role, email_verified, is_active)
VALUES (
  'admin@roundbuy.com',
  '$2b$10$YourHashedPasswordHere',  -- Replace with actual bcrypt hash
  'Super Admin',
  'super_admin',
  TRUE,
  TRUE
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_deadline ON issues(issue_deadline);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_phase ON disputes(current_phase);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_deadline ON disputes(dispute_deadline);

-- Verify migrations
SELECT 'Admin migrations completed successfully!' as status;

-- Show admin users
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE role IN ('admin', 'super_admin');
