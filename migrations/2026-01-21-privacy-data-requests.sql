-- Migration: Add tables for privacy/data request management
-- Date: 2026-01-21
-- Related: Privacy & Account Enhancement, GDPR Compliance

START TRANSACTION;

-- Create verification_codes table for email verification
CREATE TABLE IF NOT EXISTS verification_codes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(4) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_email (email),
    INDEX idx_code (code),
    INDEX idx_expires_at (expires_at),
    UNIQUE KEY unique_email_code (email, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create data_requests table for GDPR compliance
CREATE TABLE IF NOT EXISTS data_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    request_type ENUM('deletion', 'download', 'delete_data', 'delete_account') NOT NULL,
    reason TEXT NOT NULL,
    additional_info TEXT,
    status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    processed_at DATETIME(6),
    processed_by VARCHAR(36),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_request_type (request_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

-- Rollback (commented):
-- START TRANSACTION;
-- DROP TABLE IF EXISTS data_requests;
-- DROP TABLE IF EXISTS verification_codes;
-- COMMIT;
