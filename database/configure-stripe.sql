-- Configure Stripe Keys
INSERT INTO settings (category, setting_key, setting_value, description) VALUES
('payment', 'stripe_publishable_key', '', 'Stripe Publishable Key'),
('payment', 'stripe_secret_key', '', 'Stripe Secret Key')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Verify
SELECT setting_key, LEFT(setting_value, 20) as value_preview FROM settings WHERE setting_key LIKE 'stripe%';
