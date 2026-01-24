-- ============================================================================
-- RoundBuy Advertisement Visibility Plans Setup
-- ============================================================================
-- This migration updates advertisement_plans and creates advertisement_promotions
-- ============================================================================

-- ============================================================================
-- STEP 1: Update advertisement_plans table structure
-- ============================================================================

-- Add new columns to existing advertisement_plans table
ALTER TABLE advertisement_plans 
ADD COLUMN IF NOT EXISTS plan_type ENUM('rise_to_top', 'top_spot', 'show_casing', 'targeted', 'fast') AFTER slug,
ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 1 COMMENT 'Search priority 1-100, higher = better' AFTER plan_type,
ADD COLUMN IF NOT EXISTS duration_label VARCHAR(50) COMMENT 'Display label: once, 1 day, 3 days, 7 days, etc' AFTER duration_days,
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Original price before discount' AFTER duration_label,
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Current promotional price' AFTER base_price,
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'GBP' AFTER discounted_price,
ADD COLUMN IF NOT EXISTS distance_boost_km INT DEFAULT 3 COMMENT 'Default visibility radius in km' AFTER currency_code,
ADD COLUMN IF NOT EXISTS allows_distance_boost BOOLEAN DEFAULT TRUE COMMENT 'Can add distance boost add-on' AFTER distance_boost_km,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 AFTER is_active;

-- Add indexes for new columns
ALTER TABLE advertisement_plans 
ADD INDEX IF NOT EXISTS idx_plan_type (plan_type),
ADD INDEX IF NOT EXISTS idx_priority_level (priority_level),
ADD INDEX IF NOT EXISTS idx_sort_order (sort_order);

-- Update price column comment (keeping for backward compatibility)
ALTER TABLE advertisement_plans 
MODIFY COLUMN price DECIMAL(10, 2) DEFAULT NULL COMMENT 'Deprecated - use discounted_price instead';

-- ============================================================================
-- STEP 2: Create distance_boost_plans table
-- ============================================================================

CREATE TABLE IF NOT EXISTS distance_boost_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'Distance Boost - 5 km, 7 km, 10 km, unlimited',
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    distance_km INT DEFAULT NULL COMMENT 'Distance in km, NULL for unlimited',
    is_unlimited BOOLEAN DEFAULT FALSE COMMENT 'TRUE for country-wide unlimited',
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discounted_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'GBP',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_distance_km (distance_km)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 3: Create advertisement_promotions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS advertisement_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- References
    advertisement_id INT NOT NULL COMMENT 'The advertisement being promoted',
    user_id INT NOT NULL COMMENT 'User who purchased the promotion',
    advertisement_plan_id INT NOT NULL COMMENT 'Reference to advertisement_plans',
    distance_boost_plan_id INT DEFAULT NULL COMMENT 'Optional distance boost add-on',
    
    -- Promotion details
    plan_type ENUM('rise_to_top', 'top_spot', 'show_casing', 'targeted', 'fast') NOT NULL,
    priority_level INT DEFAULT 1 COMMENT 'Cached from plan for faster queries',
    
    -- Duration and timing
    duration_days INT NOT NULL,
    duration_label VARCHAR(50),
    start_date DATETIME NOT NULL COMMENT 'When promotion becomes active',
    end_date DATETIME NOT NULL COMMENT 'When promotion expires',
    
    -- Distance boost details
    distance_boost_km INT DEFAULT 3 COMMENT 'Visibility radius in km',
    is_distance_unlimited BOOLEAN DEFAULT FALSE,
    
    -- Pricing and payment
    plan_price DECIMAL(10, 2) NOT NULL COMMENT 'Price paid for main promotion plan',
    distance_boost_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Price paid for distance boost',
    total_price DECIMAL(10, 2) NOT NULL COMMENT 'Total amount paid',
    currency_code VARCHAR(3) DEFAULT 'GBP',
    
    -- Payment tracking
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_intent_id VARCHAR(255) COMMENT 'Stripe Payment Intent ID',
    payment_method VARCHAR(50) COMMENT 'card, paypal, etc',
    paid_at DATETIME DEFAULT NULL,
    
    -- Status and lifecycle
    status ENUM('pending', 'active', 'paused', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Quick check if promotion is currently active',
    
    -- Performance metrics
    impressions_count INT DEFAULT 0 COMMENT 'How many times ad was shown in search',
    clicks_count INT DEFAULT 0 COMMENT 'How many times ad was clicked',
    views_count INT DEFAULT 0 COMMENT 'How many times ad detail page was viewed',
    
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
    FOREIGN KEY (advertisement_plan_id) REFERENCES advertisement_plans(id),
    FOREIGN KEY (distance_boost_plan_id) REFERENCES distance_boost_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_advertisement_id (advertisement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_advertisement_plan_id (advertisement_plan_id),
    INDEX idx_plan_type (plan_type),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_priority_level (priority_level),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    
    -- Composite indexes for common queries
    INDEX idx_active_promotions (is_active, end_date, priority_level),
    INDEX idx_user_active (user_id, is_active, end_date),
    INDEX idx_ad_active (advertisement_id, is_active, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 4: Clear existing data and insert visibility plans
-- ============================================================================

-- Clear existing plans (if any) - disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM advertisement_plans;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- RISE TO TOP PLANS (Priority: 30)
-- ============================================================================

INSERT INTO advertisement_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, features, is_active, sort_order) 
VALUES
('Rise to Top - Once', 'rise-to-top-once', 
 'Your ad rises to the top of search results once. Note: Rise to Top ads are displayed around you for the distance of 3 km without Distance boost.', 
 'rise_to_top', 30, 0, 'once', 2.00, 1.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Rise to Top"}', TRUE, 1),

('Rise to Top - 3 Days', 'rise-to-top-3-days', 
 'Your ad stays at the top for 3 days. Note: Rise to Top ads are displayed around you for the distance of 3 km without Distance boost.', 
 'rise_to_top', 30, 3, '3 days', 6.00, 3.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Rise to Top"}', TRUE, 2),

('Rise to Top - 7 Days', 'rise-to-top-7-days', 
 'Your ad stays at the top for 7 days. Note: Rise to Top ads are displayed around you for the distance of 3 km without Distance boost.', 
 'rise_to_top', 30, 7, '7 days', 12.00, 6.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Rise to Top"}', TRUE, 3),

('Rise to Top - 14 Days', 'rise-to-top-14-days', 
 'Your ad stays at the top for 14 days. Note: Rise to Top ads are displayed around you for the distance of 3 km without Distance boost.', 
 'rise_to_top', 30, 14, '14 days', 24.00, 12.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Rise to Top"}', TRUE, 4);

-- ============================================================================
-- TOP SPOT PLANS (Priority: 50)
-- ============================================================================

INSERT INTO advertisement_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, features, is_active, sort_order) 
VALUES
('Top Spot - 1 Day', 'top-spot-1-day', 
 'Your ad will be placed on the top of the search results for 1 day. If other similar ads are purchased after, they will get priority. Note: Top Spot ads are displayed around you for the distance of 3 km without Distance boost.', 
 'top_spot', 50, 1, '1 day', 3.50, 1.75, 'GBP', 3, TRUE,
 '{"search_priority": true, "top_of_search": true, "badge_display": "Top Spot"}', TRUE, 5),

('Top Spot - 3 Days', 'top-spot-3-days', 
 'Your ad will be placed on the top of the search results for 3 days. If other similar ads are purchased after, they will get priority. Note: Top Spot ads are displayed around you for the distance of 3 km without Distance boost.', 
 'top_spot', 50, 3, '3 days', 7.50, 3.75, 'GBP', 3, TRUE,
 '{"search_priority": true, "top_of_search": true, "badge_display": "Top Spot"}', TRUE, 6),

('Top Spot - 7 Days', 'top-spot-7-days', 
 'Your ad will be placed on the top of the search results for 7 days. If other similar ads are purchased after, they will get priority. Note: Top Spot ads are displayed around you for the distance of 3 km without Distance boost.', 
 'top_spot', 50, 7, '7 days', 13.50, 6.75, 'GBP', 3, TRUE,
 '{"search_priority": true, "top_of_search": true, "badge_display": "Top Spot"}', TRUE, 7),

('Top Spot - 14 Days', 'top-spot-14-days', 
 'Your ad will be placed on the top of the search results for 14 days. If other similar ads are purchased after, they will get priority. Note: Top Spot ads are displayed around you for the distance of 3 km without Distance boost.', 
 'top_spot', 50, 14, '14 days', 26.50, 13.75, 'GBP', 3, TRUE,
 '{"search_priority": true, "top_of_search": true, "badge_display": "Top Spot"}', TRUE, 8);

-- ============================================================================
-- SHOW CASING PLANS (Priority: 70)
-- ============================================================================

INSERT INTO advertisement_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, features, is_active, sort_order) 
VALUES
('Show Casing - 7 Days', 'show-casing-7-days', 
 'Showcase your ad prominently on homepage and category pages for 7 days. Note: Show Casing ads are displayed around you for the distance of 3 km without Distance boost.', 
 'show_casing', 70, 7, '7 days', 8.00, 4.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "badge_display": "Featured"}', TRUE, 9),

('Show Casing - 14 Days', 'show-casing-14-days', 
 'Showcase your ad prominently on homepage and category pages for 14 days. Note: Show Casing ads are displayed around you for the distance of 3 km without Distance boost.', 
 'show_casing', 70, 14, '14 days', 15.00, 7.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "badge_display": "Featured"}', TRUE, 10),

('Show Casing - 21 Days', 'show-casing-21-days', 
 'Showcase your ad prominently on homepage and category pages for 21 days. Note: Show Casing ads are displayed around you for the distance of 3 km without Distance boost.', 
 'show_casing', 70, 21, '21 days', 23.00, 11.50, 'GBP', 3, TRUE,
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "badge_display": "Featured"}', TRUE, 11),

('Show Casing - 28 Days', 'show-casing-28-days', 
 'Showcase your ad prominently on homepage and category pages for 28 days. Note: Show Casing ads are displayed around you for the distance of 3 km without Distance boost.', 
 'show_casing', 70, 28, '28 days', 31.00, 16.50, 'GBP', 3, TRUE,
 '{"search_priority": true, "homepage_featured": true, "category_featured": true, "highlighted_listing": true, "badge_display": "Featured"}', TRUE, 12);

-- ============================================================================
-- TARGETED AD PLANS (Priority: 40)
-- ============================================================================

INSERT INTO advertisement_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, features, is_active, sort_order) 
VALUES
('Targeted Ad - 3 Days', 'targeted-ad-3-days', 
 'Target specific audience based on location for 3 days. Note: Targeted ads are displayed around you for the distance of 3 km without Distance boost.', 
 'targeted', 40, 3, '3 days', 2.00, 1.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "location_targeting": true, "badge_display": "Targeted"}', TRUE, 13),

('Targeted Ad - 7 Days', 'targeted-ad-7-days', 
 'Target specific audience based on location for 7 days. Note: Targeted ads are displayed around you for the distance of 3 km without Distance boost.', 
 'targeted', 40, 7, '7 days', 4.00, 2.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "location_targeting": true, "badge_display": "Targeted"}', TRUE, 14),

('Targeted Ad - 10 Days', 'targeted-ad-10-days', 
 'Target specific audience based on location for 10 days. Note: Targeted ads are displayed around you for the distance of 3 km without Distance boost.', 
 'targeted', 40, 10, '10 days', 8.00, 4.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "location_targeting": true, "badge_display": "Targeted"}', TRUE, 15);

-- ============================================================================
-- FAST AD PLANS (Priority: 35)
-- ============================================================================

INSERT INTO advertisement_plans 
(name, slug, description, plan_type, priority_level, duration_days, duration_label, base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, features, is_active, sort_order) 
VALUES
('Fast Ad - 3 Days', 'fast-ad-3-days', 
 'Quick visibility boost for 3 days. Note: Fast ads are displayed around you for the distance of 3 km without Distance boost.', 
 'fast', 35, 3, '3 days', 2.00, 1.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Fast"}', TRUE, 16),

('Fast Ad - 7 Days', 'fast-ad-7-days', 
 'Quick visibility boost for 7 days. Note: Fast ads are displayed around you for the distance of 3 km without Distance boost.', 
 'fast', 35, 7, '7 days', 4.00, 2.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Fast"}', TRUE, 17),

('Fast Ad - 10 Days', 'fast-ad-10-days', 
 'Quick visibility boost for 10 days. Note: Fast ads are displayed around you for the distance of 3 km without Distance boost.', 
 'fast', 35, 10, '10 days', 8.00, 4.00, 'GBP', 3, TRUE,
 '{"search_priority": true, "badge_display": "Fast"}', TRUE, 18);

-- ============================================================================
-- STEP 5: Insert Distance Boost Plans
-- ============================================================================

INSERT INTO distance_boost_plans 
(name, slug, description, distance_km, is_unlimited, base_price, discounted_price, currency_code, is_active, sort_order) 
VALUES
('Distance Boost - 5 km', 'distance-boost-5km', 
 'Extend your ad visibility to 5 km radius from your location', 
 5, FALSE, 1.00, 0.50, 'GBP', TRUE, 1),

('Distance Boost - 7 km', 'distance-boost-7km', 
 'Extend your ad visibility to 7 km radius from your location', 
 7, FALSE, 2.00, 1.00, 'GBP', TRUE, 2),

('Distance Boost - 10 km', 'distance-boost-10km', 
 'Extend your ad visibility to 10 km radius from your location', 
 10, FALSE, 3.00, 1.50, 'GBP', TRUE, 3),

('Distance Boost - Unlimited', 'distance-boost-unlimited', 
 'Extend your ad visibility to unlimited distance (your entire country)', 
 NULL, TRUE, 4.00, 2.00, 'GBP', TRUE, 4);

-- ============================================================================
-- STEP 6: Update subscription_plans features (if needed)
-- ============================================================================

-- Update existing subscription plans to include promotion limits
-- This is optional - only run if you want to add promotion limits to subscription plans

UPDATE subscription_plans 
SET features = JSON_SET(
    COALESCE(features, '{}'),
    '$.promotion_limits', JSON_OBJECT(
        'max_active_promotions', 1,
        'allowed_promotion_types', JSON_ARRAY('fast'),
        'distance_boost_included', FALSE,
        'promotion_discount_percent', 0
    )
)
WHERE slug = 'green';

UPDATE subscription_plans 
SET features = JSON_SET(
    COALESCE(features, '{}'),
    '$.promotion_limits', JSON_OBJECT(
        'max_active_promotions', 3,
        'allowed_promotion_types', JSON_ARRAY('fast', 'targeted', 'rise_to_top'),
        'distance_boost_included', FALSE,
        'promotion_discount_percent', 10
    )
)
WHERE slug = 'gold';

UPDATE subscription_plans 
SET features = JSON_SET(
    COALESCE(features, '{}'),
    '$.promotion_limits', JSON_OBJECT(
        'max_active_promotions', 10,
        'allowed_promotion_types', JSON_ARRAY('fast', 'targeted', 'rise_to_top', 'top_spot', 'show_casing'),
        'distance_boost_included', TRUE,
        'promotion_discount_percent', 20
    )
)
WHERE slug = 'violet';

UPDATE subscription_plans 
SET features = JSON_SET(
    COALESCE(features, '{}'),
    '$.promotion_limits', JSON_OBJECT(
        'max_active_promotions', -1,
        'allowed_promotion_types', JSON_ARRAY('fast', 'targeted', 'rise_to_top', 'top_spot', 'show_casing'),
        'distance_boost_included', TRUE,
        'promotion_discount_percent', 30
    )
)
WHERE slug = 'enterprise';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary of changes:
-- 1. ✅ Updated advertisement_plans table with new columns
-- 2. ✅ Created distance_boost_plans table
-- 3. ✅ Created advertisement_promotions table
-- 4. ✅ Inserted 18 visibility plans (Rise to Top, Top Spot, Show Casing, Targeted, Fast)
-- 5. ✅ Inserted 4 distance boost options (5km, 7km, 10km, unlimited)
-- 6. ✅ Updated subscription_plans features with promotion limits
--
-- Next steps:
-- - Implement API endpoints for purchasing promotions
-- - Update search queries to use priority_level
-- - Create admin UI for managing promotions
-- - Set up cron job to expire promotions
-- ============================================================================
