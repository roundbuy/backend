-- Add Stripe fields to advertisement_plans
ALTER TABLE advertisement_plans 
ADD COLUMN stripe_product_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Product ID' AFTER features,
ADD COLUMN stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for default currency' AFTER stripe_product_id,
ADD INDEX idx_stripe_product_id (stripe_product_id);

-- Add Stripe fields to banner_plans
ALTER TABLE banner_plans 
ADD COLUMN stripe_product_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Product ID' AFTER max_clicks,
ADD COLUMN stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for default currency' AFTER stripe_product_id,
ADD INDEX idx_stripe_product_id (stripe_product_id);

-- Create advertisement_plan_prices table for multi-currency support
CREATE TABLE IF NOT EXISTS advertisement_plan_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    advertisement_plan_id INT NOT NULL,
    currency_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Tax rate as percentage',
    stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for this currency',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (advertisement_plan_id) REFERENCES advertisement_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_currency (advertisement_plan_id, currency_id),
    INDEX idx_advertisement_plan_id (advertisement_plan_id),
    INDEX idx_currency_id (currency_id),
    INDEX idx_stripe_price_id (stripe_price_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create banner_plan_prices table for multi-currency support
CREATE TABLE IF NOT EXISTS banner_plan_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    banner_plan_id INT NOT NULL,
    currency_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Tax rate as percentage',
    stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for this currency',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (banner_plan_id) REFERENCES banner_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_currency (banner_plan_id, currency_id),
    INDEX idx_banner_plan_id (banner_plan_id),
    INDEX idx_currency_id (currency_id),
    INDEX idx_stripe_price_id (stripe_price_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing prices from advertisement_plans to advertisement_plan_prices
INSERT INTO advertisement_plan_prices (advertisement_plan_id, currency_id, price, tax_rate)
SELECT ap.id, c.id, ap.price, 0.00
FROM advertisement_plans ap
CROSS JOIN currencies c
WHERE c.is_default = TRUE AND ap.price > 0
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Migrate existing prices from banner_plans to banner_plan_prices
INSERT INTO banner_plan_prices (banner_plan_id, currency_id, price, tax_rate)
SELECT bp.id, c.id, bp.price, 0.00
FROM banner_plans bp
CROSS JOIN currencies c
WHERE c.is_default = TRUE AND bp.price > 0
ON DUPLICATE KEY UPDATE price = VALUES(price);
