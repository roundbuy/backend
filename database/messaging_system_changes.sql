-- Messaging System Database Changes
-- RoundBuy C2C Marketplace
-- Date: 2025-12-04

-- Add advertisement_id column to messages table
ALTER TABLE messages ADD COLUMN advertisement_id INT DEFAULT NULL AFTER product_id;
ALTER TABLE messages ADD FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE;

-- Create conversations table for grouping messages
CREATE TABLE conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    advertisement_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (advertisement_id, buyer_id, seller_id),
    INDEX idx_advertisement_id (advertisement_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create offers table for price negotiations
CREATE TABLE offers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    offered_price DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'INR',
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'counter_offered', 'expired') DEFAULT 'pending',
    expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update messages table to include conversation_id
ALTER TABLE messages ADD COLUMN conversation_id INT DEFAULT NULL AFTER advertisement_id;
ALTER TABLE messages ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Add indexes for better performance
ALTER TABLE messages ADD INDEX idx_conversation_id (conversation_id);
ALTER TABLE messages ADD INDEX idx_sender_receiver (sender_id, receiver_id);
ALTER TABLE messages ADD INDEX idx_is_read (is_read);

-- Update favorites table to reference advertisements instead of products
-- (This will be done in a separate migration to avoid conflicts)
-- ALTER TABLE favorites DROP FOREIGN KEY favorites_ibfk_2;
-- ALTER TABLE favorites ADD COLUMN advertisement_id INT DEFAULT NULL;
-- ALTER TABLE favorites ADD FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE;
-- ALTER TABLE favorites DROP COLUMN product_id;