-- Migration: Add negotiation logic to claims (Replicating Dispute Flow) - FIXED V3
-- This migration adds per-user decision columns and updates the status enum
-- USES DATABASE() to avoid schema name issues

-- 1. Modify Status Enum to include 'negotiating' and 'settled'
ALTER TABLE claims MODIFY COLUMN status ENUM('pending', 'under_review', 'negotiating', 'settled', 'resolved', 'closed') DEFAULT 'pending';

-- 2. Add/Modify columns using a procedure for robustness
DROP PROCEDURE IF EXISTS FixClaimNegotiationColumns;
DELIMITER //
CREATE PROCEDURE FixClaimNegotiationColumns()
BEGIN
    DECLARE current_db VARCHAR(100);
    SELECT DATABASE() INTO current_db;

    -- updated_at column
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'updated_at') THEN
        ALTER TABLE claims ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
    END IF;

    -- seller_decision
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'seller_decision') THEN
        ALTER TABLE claims ADD COLUMN seller_decision ENUM('accept', 'decline', 'negotiate') NULL AFTER seller_response;
    ELSE
        ALTER TABLE claims MODIFY COLUMN seller_decision ENUM('accept', 'decline', 'negotiate') NULL;
    END IF;

    -- buyer_suggestion
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'buyer_suggestion') THEN
        ALTER TABLE claims ADD COLUMN buyer_suggestion TEXT AFTER seller_decision;
    END IF;
    
    -- seller_suggestion
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'seller_suggestion') THEN
        ALTER TABLE claims ADD COLUMN seller_suggestion TEXT AFTER buyer_suggestion;
    END IF;

    -- negotiation_buyer_decision
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'negotiation_buyer_decision') THEN
        ALTER TABLE claims ADD COLUMN negotiation_buyer_decision ENUM('accept', 'decline') NULL AFTER seller_suggestion;
    END IF;

    -- negotiation_seller_decision
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = current_db AND table_name = 'claims' AND column_name = 'negotiation_seller_decision') THEN
        ALTER TABLE claims ADD COLUMN negotiation_seller_decision ENUM('accept', 'decline') NULL AFTER negotiation_buyer_decision;
    END IF;
END //
DELIMITER ;

CALL FixClaimNegotiationColumns();
DROP PROCEDURE IF EXISTS FixClaimNegotiationColumns;
