-- Create advertisement_feedbacks table for user feedback system
-- This table stores feedbacks given by users for completed advertisement transactions

DROP TABLE IF EXISTS advertisement_feedbacks;

CREATE TABLE advertisement_feedbacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    advertisement_id INT NOT NULL COMMENT 'The advertisement this feedback is about',
    offer_id INT DEFAULT NULL COMMENT 'The specific offer/transaction (optional)',
    reviewer_id INT NOT NULL COMMENT 'User giving the feedback',
    reviewed_user_id INT NOT NULL COMMENT 'User receiving the feedback (seller/buyer)',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT 'Rating from 1 to 5 stars',
    comment TEXT COMMENT 'Written feedback/review',
    transaction_type ENUM('buy', 'sell', 'rent', 'give', 'service') DEFAULT 'sell' COMMENT 'Type of transaction',
    is_visible BOOLEAN DEFAULT TRUE COMMENT 'Admin can hide inappropriate feedbacks',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint: One feedback per user per advertisement/offer combination
    UNIQUE KEY unique_feedback (reviewer_id, advertisement_id, offer_id),
    
    -- Indexes for performance
    INDEX idx_advertisement_id (advertisement_id),
    INDEX idx_reviewed_user_id (reviewed_user_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add average_rating and total_feedbacks columns to users table for caching
ALTER TABLE users 
ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Cached average rating from feedbacks',
ADD COLUMN total_feedbacks INT DEFAULT 0 COMMENT 'Total number of feedbacks received',
ADD INDEX idx_average_rating (average_rating);

-- Create a view for easy feedback statistics
CREATE OR REPLACE VIEW user_feedback_stats AS
SELECT 
    reviewed_user_id as user_id,
    COUNT(*) as total_feedbacks,
    AVG(rating) as average_rating,
    SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as positive_percentage,
    SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as negative_percentage,
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as neutral_percentage
FROM advertisement_feedbacks
WHERE is_visible = TRUE
GROUP BY reviewed_user_id;
