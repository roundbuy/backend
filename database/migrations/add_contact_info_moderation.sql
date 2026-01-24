-- Add contact information moderation words
-- This script adds patterns to detect phone numbers, emails, and other contact info in chat messages

-- First, update the category ENUM to include 'contact_info'
ALTER TABLE moderation_words 
MODIFY COLUMN category ENUM('offensive', 'spam', 'inappropriate', 'prohibited', 'contact_info') DEFAULT 'inappropriate';

-- Insert phone number patterns (common formats)
INSERT INTO moderation_words (word, category, severity, is_active) VALUES
-- Phone number patterns
('\\d{10}', 'contact_info', 'high', TRUE),  -- 10 digit numbers
('\\d{3}-\\d{3}-\\d{4}', 'contact_info', 'high', TRUE),  -- 123-456-7890
('\\d{3}\\.\\d{3}\\.\\d{4}', 'contact_info', 'high', TRUE),  -- 123.456.7890
('\\(\\d{3}\\)\\s*\\d{3}-\\d{4}', 'contact_info', 'high', TRUE),  -- (123) 456-7890
('\\+\\d{1,3}\\s*\\d{10}', 'contact_info', 'high', TRUE),  -- +91 1234567890
('\\+\\d{1,3}-\\d{10}', 'contact_info', 'high', TRUE),  -- +91-1234567890

-- Common phone number keywords
('phone', 'contact_info', 'high', TRUE),
('mobile', 'contact_info', 'high', TRUE),
('cell', 'contact_info', 'high', TRUE),
('call me', 'contact_info', 'high', TRUE),
('text me', 'contact_info', 'high', TRUE),
('whatsapp', 'contact_info', 'high', TRUE),
('telegram', 'contact_info', 'high', TRUE),

-- Email patterns
('@gmail', 'contact_info', 'high', TRUE),
('@yahoo', 'contact_info', 'high', TRUE),
('@hotmail', 'contact_info', 'high', TRUE),
('@outlook', 'contact_info', 'high', TRUE),
('@icloud', 'contact_info', 'high', TRUE),
('email', 'contact_info', 'high', TRUE),
('e-mail', 'contact_info', 'high', TRUE),

-- Social media and external platforms
('facebook', 'contact_info', 'medium', TRUE),
('instagram', 'contact_info', 'medium', TRUE),
('twitter', 'contact_info', 'medium', TRUE),
('snapchat', 'contact_info', 'medium', TRUE),
('tiktok', 'contact_info', 'medium', TRUE),
('linkedin', 'contact_info', 'medium', TRUE),

-- External messaging apps
('skype', 'contact_info', 'medium', TRUE),
('discord', 'contact_info', 'medium', TRUE),
('signal', 'contact_info', 'medium', TRUE),
('viber', 'contact_info', 'medium', TRUE),
('wechat', 'contact_info', 'medium', TRUE),

-- URL patterns
('http://', 'contact_info', 'high', TRUE),
('https://', 'contact_info', 'high', TRUE),
('www.', 'contact_info', 'high', TRUE),
('.com', 'contact_info', 'medium', TRUE),
('.net', 'contact_info', 'medium', TRUE),
('.org', 'contact_info', 'medium', TRUE),

-- Payment/transaction keywords (to prevent off-platform transactions)
('paypal', 'contact_info', 'high', TRUE),
('venmo', 'contact_info', 'high', TRUE),
('cashapp', 'contact_info', 'high', TRUE),
('zelle', 'contact_info', 'high', TRUE),
('bank account', 'contact_info', 'high', TRUE),
('wire transfer', 'contact_info', 'high', TRUE),
('western union', 'contact_info', 'high', TRUE),
('moneygram', 'contact_info', 'high', TRUE),
('bitcoin', 'contact_info', 'medium', TRUE),
('crypto', 'contact_info', 'medium', TRUE)

ON DUPLICATE KEY UPDATE 
  category = VALUES(category),
  severity = VALUES(severity),
  is_active = VALUES(is_active);

SELECT 'Contact information moderation words added successfully!' AS status;
SELECT COUNT(*) as total_contact_info_words FROM moderation_words WHERE category = 'contact_info';
