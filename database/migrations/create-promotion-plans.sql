-- ============================================================================
-- RoundBuy Advertisement & Banner Promotion Plans Migration
-- ============================================================================
-- This migration creates the complete promotion/visibility plans system
-- for advertisements and banners with distance boost add-ons
-- ============================================================================

-- ============================================================================
-- 1. ADVERTISEMENT PROMOTION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advertisement_promotion_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Plan identification
    name VARCHAR(100) NOT NULL COMMENT 'Rise to Top, Top Spot, Show Casing, Targeted, Fast',
    slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'rise-to-top, top-spot, show-casing, targeted, fast',
    description TEXT COMMENT 'Detailed description of what this plan offers',
    
    -- Plan type and features
    plan_type ENUM('rise_to_top', 'top_spot', 'show_casing', 'targeted', 'fast') NOT NULL,
    priority_level INT DEFAULT 1 COMMENT 'Higher number = higher priority in search results (1-100)',
    
    -- Duration options (in days)
    duration_days INT NOT NULL COMMENT 'Duration of the promotion in days',
    duration_label VARCHAR(50) COMMENT 'once, 3 days, 7 days, 14 days, 21 days, 28 days',
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Original price',
    discounted_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Current promotional price',
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Features
    features JSON COMMENT 'Plan features and capabilities',
    
    -- Subscription plan restrictions
    allowed_for_subscription_ids JSON COMMENT 'Array of subscription plan IDs that can use this plan, NULL = all',
    min_subscription_level INT DEFAULT 1 COMMENT 'Minimum subscription level required (1=Green, 2=Gold, 3=Violet, 4=Enterprise)',
    
    -- Limits and restrictions
    max_active_per_user INT DEFAULT NULL COMMENT 'Max active promotions of this type per user, NULL = unlimited',
    requires_approval BOOLEAN DEFAULT FALSE COMMENT 'Whether this promotion requires admin approval',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Show this plan prominently in UI',
    sort_order INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_plan_type (plan_type),
    INDEX idx_is_active (is_active),
    INDEX idx_priority_level (priority_level),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. DISTANCE BOOST PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS distance_boost_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Plan identification
    name VARCHAR(100) NOT NULL COMMENT '5 km, 7 km, 10 km, unlimited',
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Distance configuration
    distance_km INT DEFAULT NULL COMMENT 'Distance in kilometers, NULL for unlimited',
    is_unlimited BOOLEAN DEFAULT FALSE COMMENT 'TRUE for country-wide unlimited boost',
    country_code VARCHAR(3) DEFAULT NULL COMMENT 'For unlimited plans, which country',
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Original price',
    discounted_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Current promotional price',
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Restrictions
    allowed_for_subscription_ids JSON COMMENT 'Array of subscription plan IDs, NULL = all',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_distance_km (distance_km)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. ADVERTISEMENT PROMOTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advertisement_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- References
    advertisement_id INT NOT NULL COMMENT 'The advertisement being promoted',
    user_id INT NOT NULL COMMENT 'User who purchased the promotion',
    promotion_plan_id INT NOT NULL COMMENT 'Reference to advertisement_promotion_plans',
    distance_boost_plan_id INT DEFAULT NULL COMMENT 'Optional distance boost add-on',
    
    -- Promotion details
    promotion_type ENUM('rise_to_top', 'top_spot', 'show_casing', 'targeted', 'fast') NOT NULL,
    priority_level INT DEFAULT 1 COMMENT 'Cached from plan for faster queries',
    
    -- Duration and timing
    duration_days INT NOT NULL,
    start_date DATETIME NOT NULL COMMENT 'When promotion becomes active',
    end_date DATETIME NOT NULL COMMENT 'When promotion expires',
    
    -- Distance boost details (if applicable)
    distance_boost_km INT DEFAULT 3 COMMENT 'Default 3km, or from distance_boost_plan',
    is_distance_unlimited BOOLEAN DEFAULT FALSE,
    
    -- Pricing and payment
    promotion_price DECIMAL(10, 2) NOT NULL COMMENT 'Price paid for main promotion',
    distance_boost_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Price paid for distance boost',
    total_price DECIMAL(10, 2) NOT NULL COMMENT 'Total amount paid',
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Payment tracking
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(255) COMMENT 'Stripe Payment Intent ID',
    payment_method VARCHAR(50),
    paid_at DATETIME DEFAULT NULL,
    
    -- Status and lifecycle
    status ENUM('pending', 'active', 'paused', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Quick check if promotion is currently active',
    
    -- Performance metrics
    impressions_count INT DEFAULT 0 COMMENT 'How many times ad was shown',
    clicks_count INT DEFAULT 0 COMMENT 'How many times ad was clicked',
    views_count INT DEFAULT 0 COMMENT 'How many times ad detail was viewed',
    
    -- Admin actions
    approved_by_admin_id INT DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_plan_id) REFERENCES advertisement_promotion_plans(id),
    FOREIGN KEY (distance_boost_plan_id) REFERENCES distance_boost_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_advertisement_id (advertisement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_promotion_plan_id (promotion_plan_id),
    INDEX idx_promotion_type (promotion_type),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_priority_level (priority_level),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    
    -- Composite indexes for common queries
    INDEX idx_active_promotions (is_active, end_date, priority_level),
    INDEX idx_user_active (user_id, is_active, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. BANNER PROMOTION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS banner_promotion_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Plan identification
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Plan type
    plan_type ENUM('standard', 'premium', 'featured') DEFAULT 'standard',
    
    -- Placement
    placement ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
    dimensions JSON COMMENT '{"width": 1200, "height": 300}',
    
    -- Duration
    duration_days INT NOT NULL,
    duration_label VARCHAR(50),
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discounted_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Limits
    max_impressions INT DEFAULT NULL COMMENT 'Max impressions allowed, NULL = unlimited',
    max_clicks INT DEFAULT NULL COMMENT 'Max clicks allowed, NULL = unlimited',
    
    -- Restrictions
    allowed_for_subscription_ids JSON,
    min_subscription_level INT DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_placement (placement),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. BANNER PROMOTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS banner_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- References
    banner_id INT NOT NULL,
    user_id INT NOT NULL,
    promotion_plan_id INT NOT NULL,
    
    -- Promotion details
    placement ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
    
    -- Duration
    duration_days INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    
    -- Pricing
    total_price DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Payment
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    paid_at DATETIME DEFAULT NULL,
    
    -- Status
    status ENUM('pending', 'active', 'paused', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Performance
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    max_impressions INT DEFAULT NULL,
    max_clicks INT DEFAULT NULL,
    
    -- Admin
    approved_by_admin_id INT DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_plan_id) REFERENCES banner_promotion_plans(id),
    FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_banner_id (banner_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_placement (placement),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PROMOTION TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotion_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Transaction details
    user_id INT NOT NULL,
    transaction_type ENUM('advertisement_promotion', 'banner_promotion', 'distance_boost', 'refund') NOT NULL,
    
    -- References (one will be populated based on type)
    advertisement_promotion_id INT DEFAULT NULL,
    banner_promotion_id INT DEFAULT NULL,
    
    -- Financial details
    amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Payment provider details
    payment_provider ENUM('stripe', 'razorpay', 'paypal', 'manual') DEFAULT 'stripe',
    payment_intent_id VARCHAR(255) COMMENT 'Stripe Payment Intent ID',
    charge_id VARCHAR(255) COMMENT 'Stripe Charge ID',
    
    -- Status
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    
    -- Additional data
    metadata JSON COMMENT 'Additional transaction metadata',
    error_message TEXT,
    
    -- Timestamps
    processed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (advertisement_promotion_id) REFERENCES advertisement_promotions(id) ON DELETE SET NULL,
    FOREIGN KEY (banner_promotion_id) REFERENCES banner_promotions(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_payment_intent_id (payment_intent_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATA POPULATION: ADVERTISEMENT PROMOTION PLANS
-- ============================================================================

-- Rise to Top Plans
INSERT INTO advertisement_promotion_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, features, sort_order) 
VALUES
('Rise to Top - Once', 'rise-to-top-once', 'Your ad rises to the top of search results once', 'rise_to_top', 30, 0, 'once', 2.00, 1.00, 'GBP', 
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 1),

('Rise to Top - 3 Days', 'rise-to-top-3-days', 'Your ad stays at the top for 3 days', 'rise_to_top', 30, 3, '3 days', 6.00, 3.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 2),

('Rise to Top - 7 Days', 'rise-to-top-7-days', 'Your ad stays at the top for 7 days', 'rise_to_top', 30, 7, '7 days', 12.00, 6.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 3),

('Rise to Top - 14 Days', 'rise-to-top-14-days', 'Your ad stays at the top for 14 days', 'rise_to_top', 30, 14, '14 days', 24.00, 12.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 4);

-- Top Spot Plans
INSERT INTO advertisement_promotion_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, features, sort_order) 
VALUES
('Top Spot - 1 Day', 'top-spot-1-day', 'Your ad will be placed on the top of search results for 1 day', 'top_spot', 50, 1, '1 day', 3.50, 1.75, 'GBP',
 '{"search_priority": true, "top_of_search": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "top"}', 5),

('Top Spot - 3 Days', 'top-spot-3-days', 'Your ad will be placed on the top of search results for 3 days', 'top_spot', 50, 3, '3 days', 7.50, 3.75, 'GBP',
 '{"search_priority": true, "top_of_search": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "top"}', 6),

('Top Spot - 7 Days', 'top-spot-7-days', 'Your ad will be placed on the top of search results for 7 days', 'top_spot', 50, 7, '7 days', 13.50, 6.75, 'GBP',
 '{"search_priority": true, "top_of_search": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "top"}', 7),

('Top Spot - 14 Days', 'top-spot-14-days', 'Your ad will be placed on the top of search results for 14 days', 'top_spot', 50, 14, '14 days', 26.50, 13.75, 'GBP',
 '{"search_priority": true, "top_of_search": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "top"}', 8);

-- Show Casing Plans
INSERT INTO advertisement_promotion_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, features, sort_order) 
VALUES
('Show Casing - 7 Days', 'show-casing-7-days', 'Showcase your ad prominently for 7 days', 'show_casing', 70, 7, '7 days', 8.00, 4.00, 'GBP',
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "featured"}', 9),

('Show Casing - 14 Days', 'show-casing-14-days', 'Showcase your ad prominently for 14 days', 'show_casing', 70, 14, '14 days', 15.00, 7.00, 'GBP',
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "featured"}', 10),

('Show Casing - 21 Days', 'show-casing-21-days', 'Showcase your ad prominently for 21 days', 'show_casing', 70, 21, '21 days', 23.00, 11.50, 'GBP',
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "featured"}', 11),

('Show Casing - 28 Days', 'show-casing-28-days', 'Showcase your ad prominently for 28 days', 'show_casing', 70, 28, '28 days', 31.00, 16.50, 'GBP',
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "featured"}', 12);

-- Targeted Ad Plans
INSERT INTO advertisement_promotion_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, features, sort_order) 
VALUES
('Targeted Ad - 3 Days', 'targeted-ad-3-days', 'Target specific audience for 3 days', 'targeted', 40, 3, '3 days', 2.00, 1.00, 'GBP',
 '{"search_priority": true, "location_targeting": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "targeted"}', 13),

('Targeted Ad - 7 Days', 'targeted-ad-7-days', 'Target specific audience for 7 days', 'targeted', 40, 7, '7 days', 4.00, 2.00, 'GBP',
 '{"search_priority": true, "location_targeting": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "targeted"}', 14),

('Targeted Ad - 10 Days', 'targeted-ad-10-days', 'Target specific audience for 10 days', 'targeted', 40, 10, '10 days', 8.00, 4.00, 'GBP',
 '{"search_priority": true, "location_targeting": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "targeted"}', 15);

-- Fast Ad Plans
INSERT INTO advertisement_promotion_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, features, sort_order) 
VALUES
('Fast Ad - 3 Days', 'fast-ad-3-days', 'Quick visibility boost for 3 days', 'fast', 35, 3, '3 days', 2.00, 1.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 16),

('Fast Ad - 7 Days', 'fast-ad-7-days', 'Quick visibility boost for 7 days', 'fast', 35, 7, '7 days', 4.00, 2.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 17),

('Fast Ad - 10 Days', 'fast-ad-10-days', 'Quick visibility boost for 10 days', 'fast', 35, 10, '10 days', 8.00, 4.00, 'GBP',
 '{"search_priority": true, "distance_boost_default_km": 3, "allows_distance_boost": true, "badge_display": "fast"}', 18);

-- ============================================================================
-- DATA POPULATION: DISTANCE BOOST PLANS
-- ============================================================================

INSERT INTO distance_boost_plans 
(name, slug, description, distance_km, is_unlimited, base_price, discounted_price, currency_code, sort_order) 
VALUES
('Distance Boost - 5 km', 'distance-boost-5km', 'Extend your ad visibility to 5 km radius', 5, FALSE, 1.00, 0.50, 'GBP', 1),
('Distance Boost - 7 km', 'distance-boost-7km', 'Extend your ad visibility to 7 km radius', 7, FALSE, 2.00, 1.00, 'GBP', 2),
('Distance Boost - 10 km', 'distance-boost-10km', 'Extend your ad visibility to 10 km radius', 10, FALSE, 3.00, 1.50, 'GBP', 3),
('Distance Boost - Unlimited', 'distance-boost-unlimited', 'Extend your ad visibility to entire country', NULL, TRUE, 4.00, 2.00, 'GBP', 4);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
