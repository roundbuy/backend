-- Migration: Add negotiate option and per-user negotiation decision fields
-- Date: 2026-03-24
-- Description: Adds 'negotiate' to seller_decision ENUM, adds per-user negotiation decision tracking

USE roundbuy;

-- 1. Update seller_decision ENUM to include 'negotiate'
ALTER TABLE disputes
MODIFY COLUMN `seller_decision` ENUM('accept', 'decline', 'negotiate') NULL;

-- 2. Add buyer_confirmed, seller_confirmed, buyer_suggestion, seller_suggestion (safe re-run)
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS `buyer_suggestion` TEXT NULL,
ADD COLUMN IF NOT EXISTS `seller_suggestion` TEXT NULL,
ADD COLUMN IF NOT EXISTS `buyer_confirmed` BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `seller_confirmed` BOOLEAN DEFAULT FALSE;

-- 3. Update status ENUM to include negotiating/settled states
ALTER TABLE disputes
MODIFY COLUMN `status` ENUM('pending', 'under_review', 'awaiting_response', 'negotiating', 'resolved', 'settled', 'closed', 'escalated') DEFAULT 'pending';

-- 4. Add per-user negotiation decision columns (no AFTER clause — appended safely)
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS `negotiation_buyer_decision` ENUM('accept', 'decline') NULL
    COMMENT 'Buyer decision on the negotiated resolution',
ADD COLUMN IF NOT EXISTS `negotiation_seller_decision` ENUM('accept', 'decline') NULL
    COMMENT 'Seller decision on the negotiated resolution';

SELECT 'Migration completed successfully!' as message;
