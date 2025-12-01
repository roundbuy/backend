
-- RoundBuy C2C Marketplace Database Schema
-- MySQL 8.0+

-- Drop existing tables (in correct order to avoid foreign key constraints)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS moderation_queue;
DROP TABLE IF EXISTS moderation_words;
DROP TABLE IF EXISTS translations;
DROP TABLE IF EXISTS translation_keys;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS banner_plans;
DROP TABLE IF EXISTS advertisements;
DROP TABLE IF EXISTS advertisement_plans;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS saved_payment_methods;
DROP TABLE IF EXISTS plan_prices;
DROP TABLE IF EXISTS user_locations;
DROP TABLE IF EXISTS ad_activities;
DROP TABLE IF EXISTS ad_conditions;
DROP TABLE IF EXISTS ad_ages;
DROP TABLE IF EXISTS ad_genders;
DROP TABLE IF EXISTS ad_sizes;
DROP TABLE IF EXISTS ad_colors;
DROP TABLE IF EXISTS users;

-- Create currencies table
CREATE TABLE currencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(3) UNIQUE NOT NULL COMMENT 'ISO currency code (USD, EUR, INR)',
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    exchange_rate DECIMAL(10, 6) DEFAULT 1.000000 COMMENT 'Exchange rate to default currency',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create saved_payment_methods table
CREATE TABLE saved_payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_method_type ENUM('card', 'bank_account', 'paypal', 'other') NOT NULL,
    provider ENUM('stripe', 'razorpay', 'paypal') NOT NULL,
    provider_payment_method_id VARCHAR(255) NOT NULL COMMENT 'Payment method ID from provider',
    last_four VARCHAR(4) COMMENT 'Last 4 digits of card',
    card_brand VARCHAR(50) COMMENT 'Visa, Mastercard, etc.',
    expiry_month INT COMMENT 'Card expiry month',
    expiry_year INT COMMENT 'Card expiry year',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_locations table
CREATE TABLE user_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Location name (e.g., Home, Office, Warehouse)',
    street VARCHAR(255),
    street2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) COMMENT 'State/Province',
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_activities table
CREATE TABLE ad_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_conditions table
CREATE TABLE ad_conditions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_ages table
CREATE TABLE ad_ages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_genders table
CREATE TABLE ad_genders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_sizes table
CREATE TABLE ad_sizes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_colors table
CREATE TABLE ad_colors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    hex_code VARCHAR(7) COMMENT 'Hex color code (e.g., #FF0000)',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create plan_prices table for multi-currency support
CREATE TABLE plan_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subscription_plan_id INT NOT NULL,
    currency_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Tax rate as percentage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_currency (subscription_plan_id, currency_id),
    INDEX idx_subscription_plan_id (subscription_plan_id),
    INDEX idx_currency_id (currency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(500),
    role ENUM('subscriber', 'editor', 'admin') DEFAULT 'subscriber',
    subscription_plan_id INT DEFAULT NULL,
    subscription_start_date DATETIME DEFAULT NULL,
    subscription_end_date DATETIME DEFAULT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(64) DEFAULT NULL,
    verification_expires DATETIME DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    language_preference VARCHAR(5) DEFAULT 'en',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_subscription_plan (subscription_plan_id),
    INDEX idx_subscription_end_date (subscription_end_date),
    INDEX idx_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subheading VARCHAR(255) COMMENT 'Short plan subtitle',
    description TEXT,
    description_bullets JSON COMMENT 'Array of feature descriptions for UI',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    renewal_price DECIMAL(10, 2) DEFAULT NULL COMMENT 'Price after first period, NULL if same as initial price',
    duration_days INT NOT NULL DEFAULT 30,
    features JSON COMMENT '{"max_ads": 10, "max_banners": 2, "featured_ads": 1, "support_priority": "standard"}',
    color_hex VARCHAR(7) DEFAULT '#4CAF50' COMMENT 'Plan color for UI (e.g., #4CAF50)',
    tag VARCHAR(20) DEFAULT NULL COMMENT 'best, popular, recommended, or NULL',
    stripe_product_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Product ID',
    stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for default currency',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_stripe_product_id (stripe_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_plan_id INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    stripe_subscription_id VARCHAR(255) COMMENT 'Stripe Subscription ID for recurring',
    stripe_customer_id VARCHAR(255) COMMENT 'Stripe Customer ID',
    payment_id VARCHAR(255) COMMENT 'Stripe Payment Intent ID',
    payment_method VARCHAR(50),
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'INR',
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_price DECIMAL(10, 2) DEFAULT NULL COMMENT 'Price for renewal if different',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date),
    INDEX idx_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_stripe_customer_id (stripe_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INT DEFAULT NULL,
    icon VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create advertisement_plans table
CREATE TABLE advertisement_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INT NOT NULL DEFAULT 30,
    allowed_for_subscription_ids JSON COMMENT 'Array of subscription plan IDs that can use this plan',
    features JSON COMMENT '{"priority_listing": true, "top_search": false, "homepage_featured": false}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create advertisements table (previously products)
CREATE TABLE advertisements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    advertisement_plan_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    images JSON COMMENT 'Array of image URLs',
    category_id INT NOT NULL,
    subcategory_id INT DEFAULT NULL,
    location_id INT DEFAULT NULL COMMENT 'Reference to user_locations table',
    price DECIMAL(10, 2) NOT NULL,
    display_duration_days INT DEFAULT 60 COMMENT '60 days or continue (NULL for continue)',
    activity_id INT DEFAULT NULL,
    condition_id INT DEFAULT NULL,
    age_id INT DEFAULT NULL,
    gender_id INT DEFAULT NULL,
    size_id INT DEFAULT NULL,
    color_id INT DEFAULT NULL,
    status ENUM('draft', 'pending', 'approved', 'published', 'expired', 'rejected', 'sold') DEFAULT 'draft',
    views_count INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    start_date DATETIME DEFAULT NULL,
    end_date DATETIME DEFAULT NULL,
    rejection_reason TEXT,
    metadata JSON COMMENT 'Additional product-specific fields',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (advertisement_plan_id) REFERENCES advertisement_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_id) REFERENCES ad_activities(id) ON DELETE SET NULL,
    FOREIGN KEY (condition_id) REFERENCES ad_conditions(id) ON DELETE SET NULL,
    FOREIGN KEY (age_id) REFERENCES ad_ages(id) ON DELETE SET NULL,
    FOREIGN KEY (gender_id) REFERENCES ad_genders(id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES ad_sizes(id) ON DELETE SET NULL,
    FOREIGN KEY (color_id) REFERENCES ad_colors(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_subcategory_id (subcategory_id),
    INDEX idx_location_id (location_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_condition_id (condition_id),
    INDEX idx_age_id (age_id),
    INDEX idx_gender_id (gender_id),
    INDEX idx_size_id (size_id),
    INDEX idx_color_id (color_id),
    INDEX idx_status (status),
    INDEX idx_featured (featured),
    INDEX idx_end_date (end_date),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create banner_plans table
CREATE TABLE banner_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INT NOT NULL DEFAULT 30,
    placement ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
    dimensions JSON COMMENT '{"width": 1200, "height": 300}',
    allowed_for_subscription_ids JSON COMMENT 'Array of subscription plan IDs',
    max_clicks INT DEFAULT NULL COMMENT 'Max clicks allowed, NULL for unlimited',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_placement (placement),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create banners table
CREATE TABLE banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    banner_plan_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    placement ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer') NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'published', 'expired', 'rejected') DEFAULT 'draft',
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    start_date DATETIME DEFAULT NULL,
    end_date DATETIME DEFAULT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banner_plan_id) REFERENCES banner_plans(id),
    INDEX idx_user_id (user_id),
    INDEX idx_placement (placement),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table (for actual marketplace items separate from ads)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL,
    condition_type ENUM('new', 'like_new', 'good', 'fair', 'poor') DEFAULT 'good',
    images JSON COMMENT 'Array of image URLs',
    location VARCHAR(255),
    status ENUM('available', 'sold', 'reserved', 'inactive') DEFAULT 'available',
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create favorites table
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    product_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create order_items table (for future multi-item orders)
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create messages table
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT DEFAULT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reviewer_id INT NOT NULL,
    reviewed_user_id INT NOT NULL,
    order_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (reviewer_id, order_id),
    INDEX idx_reviewed_user_id (reviewed_user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create languages table
CREATE TABLE languages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(5) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    flag_icon VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create translation_keys table
CREATE TABLE translation_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(255) UNIQUE NOT NULL COMMENT 'e.g., home.welcome, auth.login',
    category VARCHAR(50) NOT NULL COMMENT 'general, auth, products, etc.',
    default_text TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create translations table
CREATE TABLE translations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    translation_key_id INT NOT NULL,
    language_id INT NOT NULL,
    translated_text TEXT NOT NULL,
    is_auto_translated BOOLEAN DEFAULT FALSE,
    modified_by_admin_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (translation_key_id) REFERENCES translation_keys(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_translation (translation_key_id, language_id),
    INDEX idx_language_id (language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create moderation_words table
CREATE TABLE moderation_words (
    id INT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(255) NOT NULL,
    category ENUM('offensive', 'spam', 'inappropriate', 'prohibited') DEFAULT 'inappropriate',
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_word (word),
    INDEX idx_category (category),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create moderation_queue table
CREATE TABLE moderation_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content_type ENUM('advertisement', 'banner', 'product', 'review', 'message', 'user_profile') NOT NULL,
    content_id INT NOT NULL,
    user_id INT NOT NULL,
    flagged_words JSON COMMENT 'Array of flagged words found',
    flagged_reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'escalated') DEFAULT 'pending',
    reviewed_by_admin_id INT DEFAULT NULL,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_content_type (content_type),
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create settings table
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL COMMENT 'general, api, email, payment, notification, chat, ai',
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by_admin_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create api_logs table
CREATE TABLE api_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    user_id INT DEFAULT NULL,
    request_body JSON,
    response_body JSON,
    status_code INT NOT NULL,
    response_time_ms INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_endpoint (endpoint),
    INDEX idx_method (method),
    INDEX idx_user_id (user_id),
    INDEX idx_status_code (status_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'subscription_expiry, ad_approved, message, order_update, etc.',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON COMMENT 'Additional notification data',
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin_activity_logs table
CREATE TABLE admin_activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'user_banned, ad_approved, settings_updated, etc.',
    entity_type VARCHAR(50) COMMENT 'user, advertisement, banner, etc.',
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, subheading, description, description_bullets, duration_days, features, color_hex, tag, sort_order) VALUES
('Green', 'green', 'Perfect for getting started', 'Basic plan for new users with essential features',
 '["3 active advertisements", "Basic support", "Standard listing visibility", "Mobile app access"]',
 365, '{"max_ads": 3, "max_banners": 0, "featured_ads": 0, "support_priority": "low", "chat_enabled": true}',
 '#4CAF50', NULL, 1),

('Gold', 'gold', 'Most popular choice', 'For regular sellers who want more visibility',
 '["10 active advertisements", "Priority support", "Featured listings", "Analytics dashboard", "3 product locations"]',
 30, '{"max_ads": 10, "max_banners": 1, "featured_ads": 1, "support_priority": "standard", "chat_enabled": true, "analytics": true}',
 '#FFD700', 'best', 2),

('Violet', 'violet', 'Maximum features & support', 'For power sellers and business accounts',
 '["50 active advertisements", "Premium support", "Homepage featured", "Advanced analytics", "Verification badge", "Instant ad renewal"]',
 30, '{"max_ads": 50, "max_banners": 5, "featured_ads": 5, "support_priority": "high", "chat_enabled": true, "analytics": true, "verification_badge": true}',
 '#9C27B0', 'popular', 3),

('Enterprise', 'enterprise', 'For large businesses', 'Unlimited features for enterprise sellers',
 '["Unlimited advertisements", "Dedicated support", "API access", "Bulk upload", "Custom branding", "Priority placement"]',
 30, '{"max_ads": -1, "max_banners": 20, "featured_ads": 20, "support_priority": "highest", "chat_enabled": true, "analytics": true, "verification_badge": true, "api_access": true, "bulk_upload": true}',
 '#2196F3', NULL, 4);

-- Insert default plan prices (assuming plan IDs 1-4 from above)
INSERT INTO plan_prices (subscription_plan_id, currency_id, price, tax_rate) VALUES
-- Green plan (ID 1) - Free
(1, 1, 0.00, 0.00), (1, 2, 0.00, 0.00), (1, 3, 0.00, 0.00), (1, 4, 0.00, 0.00),
-- Gold plan (ID 2)
(2, 1, 9.99, 0.00), (2, 2, 8.49, 0.00), (2, 3, 829.00, 18.00), (2, 4, 7.29, 0.00),
-- Violet plan (ID 3)
(3, 1, 29.99, 0.00), (3, 2, 25.49, 0.00), (3, 3, 2487.00, 18.00), (3, 4, 21.89, 0.00),
-- Enterprise plan (ID 4)
(4, 1, 99.99, 0.00), (4, 2, 84.99, 0.00), (4, 3, 8291.00, 18.00), (4, 4, 72.99, 0.00);

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', 1),
('Fashion', 'fashion', 'Clothing, shoes, and accessories', 2),
('Home & Garden', 'home-garden', 'Furniture, appliances, and decor', 3),
('Vehicles', 'vehicles', 'Cars, bikes, and auto parts', 4),
('Real Estate', 'real-estate', 'Properties for rent or sale', 5),
('Services', 'services', 'Professional and personal services', 6),
('Jobs', 'jobs', 'Job listings and career opportunities', 7),
('Sports & Hobbies', 'sports-hobbies', 'Sports equipment and hobby items', 8);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, is_active, is_default, exchange_rate) VALUES
('USD', 'US Dollar', '$', TRUE, FALSE, 1.000000),
('EUR', 'Euro', '€', TRUE, FALSE, 0.850000),
('INR', 'Indian Rupee', '₹', TRUE, TRUE, 83.000000),
('GBP', 'British Pound', '£', TRUE, FALSE, 0.730000);

-- Insert default languages
INSERT INTO languages (name, code, is_default, is_active) VALUES
('English', 'en', TRUE, TRUE),
('Hindi', 'hi', FALSE, TRUE),
('Spanish', 'es', FALSE, TRUE),
('French', 'fr', FALSE, TRUE);

-- Insert default ad activities
INSERT INTO ad_activities (name, slug, sort_order) VALUES
('Buy', 'buy', 1),
('Sell', 'sell', 2),
('Rent', 'rent', 3),
('Services', 'services', 4),
('Give', 'give', 5),
('Form a Group', 'form-a-group', 6);

-- Insert default ad conditions
INSERT INTO ad_conditions (name, slug, sort_order) VALUES
('All', 'all', 1),
('New', 'new', 2),
('Excellent', 'excellent', 3),
('Good', 'good', 4),
('Satisfactory', 'satisfactory', 5);

-- Insert default ad ages
INSERT INTO ad_ages (name, slug, sort_order) VALUES
('Child', 'child', 1),
('Young', 'young', 2),
('Old', 'old', 3);

-- Insert default ad genders
INSERT INTO ad_genders (name, slug, sort_order) VALUES
('Male', 'male', 1),
('Female', 'female', 2),
('Other', 'other', 3);

-- Insert default ad sizes
INSERT INTO ad_sizes (name, slug, sort_order) VALUES
('XS', 'xs', 1),
('S', 's', 2),
('M', 'm', 3),
('L', 'l', 4),
('XL', 'xl', 5),
('XXL', 'xxl', 6);

-- Insert default ad colors
INSERT INTO ad_colors (name, slug, hex_code, sort_order) VALUES
('Red', 'red', '#FF0000', 1),
('Blue', 'blue', '#0000FF', 2),
('Green', 'green', '#00FF00', 3),
('Yellow', 'yellow', '#FFFF00', 4),
('Black', 'black', '#000000', 5),
('White', 'white', '#FFFFFF', 6),
('Gray', 'gray', '#808080', 7),
('Purple', 'purple', '#800080', 8),
('Orange', 'orange', '#FFA500', 9),
('Pink', 'pink', '#FFC0CB', 10);

-- Insert default settings
INSERT INTO settings (category, setting_key, setting_value, description) VALUES
('general', 'app_name', '"RoundBuy"', 'Application name'),
('general', 'timezone', '"Asia/Calcutta"', 'Default timezone'),
('general', 'currency', '"INR"', 'Default currency'),
('general', 'items_per_page', '20', 'Default pagination limit'),
('email', 'smtp_enabled', 'false', 'Enable SMTP email sending'),
('payment', 'stripe_enabled', 'true', 'Enable Stripe payment'),
('payment', 'stripe_secret_key', '""', 'Stripe secret key for payments'),
('payment', 'stripe_publishable_key', '""', 'Stripe publishable key for frontend'),
('payment', 'razorpay_enabled', 'false', 'Enable Razorpay payment'),
('notification', 'push_enabled', 'true', 'Enable push notifications'),
('notification', 'email_enabled', 'true', 'Enable email notifications'),
('moderation', 'auto_approve_ads', 'false', 'Auto-approve advertisements'),
('moderation', 'auto_approve_users', 'true', 'Auto-approve new user registrations'),
('api', 'rate_limit_requests', '100', 'API rate limit per window'),
('api', 'rate_limit_window_ms', '900000', 'Rate limit window in milliseconds');

-- Insert some default moderation words
INSERT INTO moderation_words (word, category, severity) VALUES
('spam', 'spam', 'medium'),
('scam', 'prohibited', 'high'),
('fake', 'inappropriate', 'medium'),
('fraud', 'prohibited', 'critical');