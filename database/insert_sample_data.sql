-- Insert Sample Data for Admin Panel Testing
-- Run this in MySQL after the schema is created

USE roundbuy_db;

-- Only insert if subscription_plans is empty
INSERT IGNORE INTO subscription_plans (id, name, slug, description, price, duration_days, features, sort_order) VALUES
(1, 'Free', 'free', 'Basic plan for new users', 0.00, 365, '{"max_ads": 3, "max_banners": 0, "featured_ads": 0, "support_priority": "low", "chat_enabled": true}', 1),
(2, 'Basic', 'basic', 'For casual sellers', 9.99, 30, '{"max_ads": 10, "max_banners": 1, "featured_ads": 1, "support_priority": "standard", "chat_enabled": true, "analytics": true}', 2),
(3, 'Premium', 'premium', 'For regular sellers', 29.99, 30, '{"max_ads": 50, "max_banners": 5, "featured_ads": 5, "support_priority": "high", "chat_enabled": true, "analytics": true, "verification_badge": true}', 3),
(4, 'Enterprise', 'enterprise', 'For business sellers', 99.99, 30, '{"max_ads": -1, "max_banners": 20, "featured_ads": 20, "support_priority": "highest", "chat_enabled": true, "analytics": true, "verification_badge": true, "api_access": true}', 4);

-- Only insert if categories is empty
INSERT IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
(1, 'Electronics', 'electronics', 'Electronic devices and accessories', 1),
(2, 'Fashion', 'fashion', 'Clothing, shoes, and accessories', 2),
(3, 'Home & Garden', 'home-garden', 'Furniture, appliances, and decor', 3),
(4, 'Vehicles', 'vehicles', 'Cars, bikes, and auto parts', 4);

-- Only insert if languages is empty  
INSERT IGNORE INTO languages (id, name, code, is_default, is_active) VALUES
(1, 'English', 'en', TRUE, TRUE),
(2, 'Hindi', 'hi', FALSE, TRUE),
(3, 'Spanish', 'es', FALSE, TRUE);

-- Only insert if settings is empty
INSERT IGNORE INTO settings (category, setting_key, setting_value, description) VALUES
('general', 'app_name', '"RoundBuy"', 'Application name'),
('general', 'timezone', '"Asia/Calcutta"', 'Default timezone'),
('general', 'currency', '"INR"', 'Default currency'),
('general', 'items_per_page', '20', 'Default pagination limit'),
('moderation', 'auto_approve_ads', 'false', 'Auto-approve advertisements'),
('moderation', 'auto_approve_users', 'true', 'Auto-approve new user registrations');

-- Insert some moderation words
INSERT IGNORE INTO moderation_words (word, category, severity) VALUES
('spam', 'spam', 'medium'),
('scam', 'prohibited', 'high'),
('fake', 'inappropriate', 'medium');