-- FAQ Management System with Categories and Subcategories
-- This system stores frequently asked questions for the RoundBuy marketplace

-- 1. FAQ Categories Table
CREATE TABLE IF NOT EXISTS faq_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Category name',
    description TEXT COMMENT 'Category description',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN NOT NULL DEFAULT true COMMENT 'Whether this category is visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. FAQ Subcategories Table
CREATE TABLE IF NOT EXISTS faq_subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'Parent category ID',
    name VARCHAR(255) NOT NULL COMMENT 'Subcategory name',
    description TEXT COMMENT 'Subcategory description',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order within category',
    is_active BOOLEAN NOT NULL DEFAULT true COMMENT 'Whether this subcategory is visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active),
    INDEX idx_category_active (category_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'Category ID',
    subcategory_id INT NOT NULL COMMENT 'Subcategory ID',
    question TEXT NOT NULL COMMENT 'The FAQ question',
    answer TEXT NOT NULL COMMENT 'The FAQ answer',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order within subcategory',
    is_active BOOLEAN NOT NULL DEFAULT true COMMENT 'Whether this FAQ is visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES faq_subcategories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_subcategory_id (subcategory_id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order),
    INDEX idx_category_subcategory (category_id, subcategory_id, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert FAQ Categories
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES
(1, 'GENERAL INFO & BASICS', 'General information and basic questions about RoundBuy', 1, true),
(2, 'SECURITY', 'Security, login, and data protection related questions', 2, true),
(3, 'DEMOSITE', 'Demo page and testing information', 3, true),
(4, 'USER ACCOUNT', 'User account management and settings', 4, true),
(5, 'MARKETPLACE & SERVICE INFO', 'Marketplace operations and service information', 5, true),
(6, 'PAYMENTS & FEES', 'Payment methods and fee structure', 6, true),
(7, 'REFERRAL PROGRAMS & REWARD & CREDITS', 'Referral programs, rewards, and credit system', 7, true),
(8, 'DISPUTES & LIMITATIONS', 'Dispute resolution and account limitations', 8, true),
(9, 'MODERATION', 'Content moderation and reporting', 9, true),
(10, 'SAFETY GUIDELINES', 'Safety tips and guidelines for users', 10, true),
(11, 'POLICIES & LEGAL', 'Terms, policies, and legal information', 11, true),
(12, 'PATENT INFO', 'Patent and intellectual property information', 12, true),
(13, 'TAX', 'Tax information and compliance', 13, true),
(14, 'APP MANUAL', 'Mobile app guide and manual', 14, true);

-- Insert FAQ Subcategories
INSERT INTO faq_subcategories (id, category_id, name, description, sort_order, is_active) VALUES
-- Category 1: GENERAL INFO & BASICS
(1, 1, 'Common questions', 'Frequently asked common questions', 1, true),
(2, 1, 'RoundBuy basics', 'Basic information about RoundBuy platform', 2, true),

-- Category 2: SECURITY
(3, 2, 'Login issues', 'Login and authentication problems', 1, true),
(4, 2, 'Fraudulent emails & scams', 'How to identify and report scams', 2, true),
(5, 2, 'Data & Security', 'Data protection and security measures', 3, true),

-- Category 3: DEMOSITE
(6, 3, 'Demo page', 'Information about demo and testing features', 1, true),

-- Category 4: USER ACCOUNT
(7, 4, 'My User Account Profile & settings', 'Profile management and account settings', 1, true),
(8, 4, 'My User Account status', 'Account status and verification', 2, true),

-- Category 5: MARKETPLACE & SERVICE INFO
(9, 5, 'Memberships', 'Membership plans and benefits', 1, true),
(10, 5, 'Search-page guide', 'How to use search and filters', 2, true),
(11, 5, 'My locations', 'Location settings and management', 3, true),
(12, 5, 'Marketplace Ads & Manage Ads', 'Creating and managing advertisements', 4, true),
(13, 5, 'Manage My Ads', 'Managing your active listings', 5, true),
(14, 5, 'Manage Product Offers', 'Handling offers on your products', 6, true),
(15, 5, 'Make an Offer & Binding offer', 'Making offers and understanding binding offers', 7, true),
(16, 5, 'Schedule Pick Up & Exchange', 'Scheduling pickups and exchanges', 8, true),
(17, 5, 'Inspection & Confirmation of Exchange', 'Product inspection and exchange confirmation', 9, true),
(18, 5, 'Feedbacks', 'Feedback and rating system', 10, true),
(19, 5, 'Notifications & Chat', 'Notifications and messaging features', 11, true),

-- Category 6: PAYMENTS & FEES
(20, 6, 'Payments & Fees of Marketplace service', 'Payment processing and fee structure', 1, true),

-- Category 7: REFERRAL PROGRAMS & REWARD & CREDITS
(21, 7, 'Referral & Rewards', 'Referral program and reward system', 1, true),

-- Category 8: DISPUTES & LIMITATIONS
(22, 8, 'Disputes and Limitations', 'General dispute information', 1, true),
(23, 8, 'Conflict Resolution between Consumer-to-Consumer (C2C)', 'C2C dispute resolution process', 2, true),
(24, 8, 'Conflict Resolution between Business-to-Consumers (B2C)', 'B2C dispute resolution process', 3, true),

-- Category 9: MODERATION
(25, 9, 'Forbidden Products / Prohibited items', 'List of prohibited items and policies', 1, true),
(26, 9, 'Report Content & Moderation', 'How to report inappropriate content', 2, true),
(27, 9, 'Blocks & Sanctions', 'Account blocks and sanctions', 3, true),

-- Category 10: SAFETY GUIDELINES
(28, 10, 'Safe Buying & Selling Guide', 'Safe business practices guide', 1, true),
(29, 10, 'Safety Guidelines', 'General safety guidelines', 2, true),
(30, 10, 'Short Guide for Selling & Buying', 'Quick guide for transactions', 3, true),

-- Category 11: POLICIES & LEGAL
(31, 11, 'Policies', 'Platform policies and terms', 1, true),
(32, 11, 'Legal info', 'Legal information and compliance', 2, true),

-- Category 12: PATENT INFO
(33, 12, 'RoundBuy Pending Patents & Patents info', 'Patent and IP information', 1, true),

-- Category 13: TAX
(34, 13, 'Tax information', 'Tax compliance and reporting', 1, true),

-- Category 14: APP MANUAL
(35, 14, 'RoundBuy App Guide', 'Mobile app user guide', 1, true);

-- Insert Sample FAQs
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES
-- Common questions
(1, 1, 'What is RoundBuy?', 'RoundBuy is a peer-to-peer marketplace platform that connects buyers and sellers for safe and secure transactions. We provide a trusted environment for buying and selling new and used items.', 1, true),
(1, 1, 'How do I create an account?', 'Click on the "Sign Up" button, fill in your details including name, email, and password. You will receive a verification email to activate your account.', 2, true),
(1, 1, 'Is RoundBuy free to use?', 'Yes, creating an account and browsing items is completely free. We charge a small commission only when you successfully sell an item.', 3, true),

-- RoundBuy basics
(1, 2, 'How does RoundBuy work?', 'Sellers list items for sale, buyers browse and make offers or purchase directly. We facilitate secure payments and provide tools for communication and dispute resolution.', 1, true),
(1, 2, 'What can I buy or sell on RoundBuy?', 'You can buy and sell a wide variety of items including electronics, fashion, home goods, sports equipment, and more. Check our prohibited items list for restrictions.', 2, true),

-- Login issues
(2, 3, 'I forgot my password. What should I do?', 'Click on "Forgot Password" on the login page. Enter your registered email address, and we will send you a password reset link.', 1, true),
(2, 3, 'Why can\'t I log in to my account?', 'Common reasons include incorrect password, unverified email, or account suspension. Try resetting your password or contact support if the issue persists.', 2, true),

-- Fraudulent emails & scams
(2, 4, 'How do I identify fraudulent emails?', 'RoundBuy will never ask for your password via email. Always check the sender\'s email address and look for official @roundbuy.com domain. Report suspicious emails to our support team.', 1, true),
(2, 4, 'What should I do if I receive a scam message?', 'Do not respond or click any links. Report the message immediately through our platform and block the sender.', 2, true),

-- Data & Security
(2, 5, 'Is my personal information safe?', 'Yes, we use industry-standard encryption to protect your data. We never share your information with third parties without your consent.', 1, true),
(2, 5, 'How is my payment information protected?', 'All payment processing is handled by Stripe, a PCI-compliant payment processor. We do not store your complete credit card information.', 2, true),

-- Memberships
(5, 9, 'What membership plans are available?', 'We offer Free, Premium, and Business membership plans. Each plan offers different benefits including reduced fees, priority support, and advanced features.', 1, true),
(5, 9, 'How do I upgrade my membership?', 'Go to your account settings and click on "Membership". Choose your desired plan and complete the payment process.', 2, true),

-- Payments & Fees
(6, 20, 'What payment methods are accepted?', 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment gateway powered by Stripe.', 1, true),
(6, 20, 'What fees does RoundBuy charge?', 'RoundBuy charges a commission on successful sales. The exact percentage depends on your membership plan. Free users pay standard commission, while premium members enjoy reduced fees.', 2, true),
(6, 20, 'When do I receive payment for my sales?', 'Payments are processed after the buyer confirms receipt. Funds are transferred to your account within 3-5 business days.', 3, true),

-- Disputes
(8, 22, 'What should I do if I have a dispute?', 'First, try to resolve the issue directly with the other party. If that fails, you can open a dispute through our Resolution Center.', 1, true),
(8, 23, 'How does C2C dispute resolution work?', 'For consumer-to-consumer disputes, our team reviews evidence from both parties and makes a fair decision based on our policies and the transaction details.', 1, true),
(8, 24, 'How does B2C dispute resolution work?', 'Business-to-consumer disputes follow a structured process with higher accountability for business sellers. We ensure consumer protection rights are maintained.', 1, true),

-- Safety Guidelines
(10, 28, 'What are the best practices for safe buying?', 'Always communicate through the platform, verify seller ratings, inspect items before confirming receipt, and report suspicious activity.', 1, true),
(10, 29, 'How can I protect myself from scams?', 'Never share personal information, avoid off-platform payments, meet in public places for local pickups, and trust your instincts.', 1, true);
