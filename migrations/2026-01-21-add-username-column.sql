-- Migration: Add username column to users table
-- Date: 2026-01-21
-- Related: Username functionality

START TRANSACTION;

-- Add username column to users table
ALTER TABLE users 
ADD COLUMN username VARCHAR(50) UNIQUE AFTER email;

-- Add index for username
CREATE INDEX idx_username ON users(username);

COMMIT;

-- Rollback (commented):
-- START TRANSACTION;
-- DROP INDEX idx_username ON users;
-- ALTER TABLE users DROP COLUMN username;
-- COMMIT;
