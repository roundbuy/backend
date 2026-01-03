-- Migration: Add missing seller fields to disputes table
-- Date: 2026-01-01
-- Description: Add seller_response, seller_decision, seller_id, and buyer_demand fields

USE roundbuy;

-- Add seller_id to track the respondent (seller)
ALTER TABLE disputes 
ADD COLUMN `seller_id` INT NULL;

-- Add buyer_demand column to store what buyer is requesting
ALTER TABLE disputes 
ADD COLUMN `buyer_demand` TEXT NULL;

-- Add seller_response column
ALTER TABLE disputes 
ADD COLUMN `seller_response` TEXT NULL;

-- Add seller_decision column
ALTER TABLE disputes 
ADD COLUMN `seller_decision` ENUM('accept', 'decline') NULL;

-- Add index for seller_id (do this before FK)
ALTER TABLE disputes 
ADD INDEX `idx_seller_disputes` (`seller_id`, `status`);

-- Try to add foreign key (may fail if users table doesn't exist, that's OK)
-- ALTER TABLE disputes 
-- ADD CONSTRAINT `fk_disputes_seller` 
-- FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

SELECT 'Migration completed successfully!' as message;
