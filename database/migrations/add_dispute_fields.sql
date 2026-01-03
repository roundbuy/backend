-- Migration: Add missing fields to disputes table
-- Date: 2026-01-01
-- Description: Add seller_response, seller_decision, type, and seller_id fields

USE roundbuy;

-- Add seller_response column
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `seller_response` TEXT NULL AFTER `problem_description`;

-- Add seller_decision column
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `seller_decision` ENUM('accept', 'decline') NULL AFTER `seller_response`;

-- Add type column for tracking dispute origin
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `type` VARCHAR(50) NULL AFTER `dispute_type`;

-- Add seller_id to track the respondent
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `seller_id` INT NULL AFTER `user_id`;

-- Add foreign key for seller_id
ALTER TABLE disputes 
ADD CONSTRAINT `fk_disputes_seller` 
FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Add index for seller_id
ALTER TABLE disputes 
ADD INDEX `idx_seller_disputes` (`seller_id`, `status`);

-- Add buyer_demand column to store what buyer is requesting
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `buyer_demand` TEXT NULL AFTER `problem_description`;

-- Add issue_id to track escalated issues
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `issue_id` INT NULL AFTER `advertisement_id`;

-- Add foreign key for issue_id
ALTER TABLE disputes 
ADD CONSTRAINT `fk_disputes_issue` 
FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE SET NULL;

-- Add index for issue_id
ALTER TABLE disputes 
ADD INDEX `idx_dispute_issue` (`issue_id`);

SELECT 'Migration completed successfully!' as message;
