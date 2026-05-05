-- Migration: Add negotiation and confirmation fields to disputes table
-- Date: 2026-03-23
-- Description: Add buyer_suggestion, seller_suggestion, buyer_confirmed, and seller_confirmed fields

USE roundbuy;

-- Add negotiation suggestion columns
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `buyer_suggestion` TEXT NULL AFTER `buyer_demand`,
ADD COLUMN IF NOT EXISTS `seller_suggestion` TEXT NULL AFTER `seller_response`;

-- Add settlement confirmation columns
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS `buyer_confirmed` BOOLEAN DEFAULT FALSE AFTER `status`,
ADD COLUMN IF NOT EXISTS `seller_confirmed` BOOLEAN DEFAULT FALSE AFTER `buyer_confirmed`;

-- Update status enum to include specialized states if needed
-- (Though existing ENUM already has 'negotiation' and 'resolved', we might want consistency)
ALTER TABLE disputes 
MODIFY COLUMN `status` ENUM('pending', 'under_review', 'awaiting_response', 'negotiating', 'resolved', 'settled', 'closed', 'escalated') DEFAULT 'pending';

-- Add index for confirmations
ALTER TABLE disputes 
ADD INDEX `idx_dispute_confirmations` (`buyer_confirmed`, `seller_confirmed`);

SELECT 'Migration for negotiation and confirmation fields completed successfully!' as message;
