-- RoundBuy Migration: 003_events_and_kyc_enhancements
-- Implementation of Social Clubs (Events), KYC/KYB, and Item Codes

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    heading VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('upcoming', 'live', 'finished', 'cancelled') DEFAULT 'upcoming',
    recurring_pattern JSON COMMENT 'e.g., {"days": ["Monday", "Wednesday", "Friday"], "times_per_event": 2}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create Event Followers Table
CREATE TABLE IF NOT EXISTS event_followers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event_follow (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Event Participants Table (for Join/Live Room)
CREATE TABLE IF NOT EXISTS event_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create KYC Records Table
CREATE TABLE IF NOT EXISTS kyc_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('KYC', 'KYB') NOT NULL,
    status ENUM('not_started', 'pending', 'verified', 'rejected') DEFAULT 'not_started',
    document_urls JSON COMMENT 'Array of uploaded document URLs',
    rejection_reason TEXT,
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_kyc_type (user_id, type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add Item Codes to Advertisements (Listings)
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS item_code VARCHAR(20) UNIQUE AFTER id;
CREATE INDEX IF NOT EXISTS idx_item_code ON advertisements(item_code);

-- 6. Add Item Codes to Products (if used separately)
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_code VARCHAR(20) UNIQUE AFTER id;
CREATE INDEX IF NOT EXISTS idx_item_code ON products(item_code);

-- 7. Add KYC Threshold fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sales_amount DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_triggered BOOLEAN DEFAULT FALSE;
