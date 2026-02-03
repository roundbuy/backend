-- Add referral code to users
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE DEFAULT NULL;

-- 1. Reward Categories
CREATE TABLE IF NOT EXISTS reward_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL COMMENT 'Icon name for mobile app',
    color VARCHAR(20) DEFAULT '#4CAF50',
    type ENUM('plan_upgrade', 'visibility_upgrade', 'badge', 'popular_searches', 'lottery', 'pickup_bonus') NOT NULL,
    required_referrals INT DEFAULT 0,
    reward_value JSON COMMENT '{"plan_id": 2} or {"visibility_ads": 2}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    referrer_id INT NOT NULL,
    referee_id INT NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_referral (referee_id)
);

-- 3. User Rewards Progress
CREATE TABLE IF NOT EXISTS user_rewards_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_category_id INT NOT NULL,
    progress_count INT DEFAULT 0,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_category_id) REFERENCES reward_categories(id) ON DELETE CASCADE
);

-- 4. Lottery Winners
CREATE TABLE IF NOT EXISTS lottery_winners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Popular Searches (Cache)
CREATE TABLE IF NOT EXISTS popular_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query VARCHAR(255) NOT NULL,
    search_count INT DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_search_count (search_count)
);

-- Insert default reward categories
INSERT INTO reward_categories (name, description, icon, color, type, required_referrals, reward_value, sort_order) VALUES
('Referral Earn Gold Plan', 'Earn Gold membership for free by referring friends', 'trophy', '#FFD700', 'plan_upgrade', 5, '{"plan_id": 2}', 1),
('10 x Lottery every month', 'Chance to win £100.00 RB credit', 'ticket', '#9C27B0', 'lottery', 0, '{"credit_amount": 100}', 2),
('Most Popular Searches now', 'See what people are searching for', 'trending-up', '#2196F3', 'popular_searches', 0, NULL, 3),
('Bonus 5 x Pick it Up Yourself', 'Get a bonus for self-pickup', 'walk', '#4CAF50', 'pickup_bonus', 0, NULL, 4);
