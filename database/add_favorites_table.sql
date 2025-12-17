-- Add favorites/wishlist table for RoundBuy
-- Run this after the main schema.sql

CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    advertisement_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_advertisement_id (advertisement_id),
    INDEX idx_user_ad (user_id, advertisement_id),

    -- Ensure no duplicate favorites
    UNIQUE KEY unique_user_advertisement (user_id, advertisement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample favorites data (optional)
-- INSERT INTO favorites (user_id, advertisement_id) VALUES
-- (1, 1), (1, 2), (2, 1);