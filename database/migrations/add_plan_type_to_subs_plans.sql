ALTER TABLE subscription_plans
ADD COLUMN plan_type ENUM('private', 'business') NOT NULL DEFAULT 'private';

-- Update existing plans based on their names/slugs if possible, or default to private
-- Assuming existing plans are 'Green', 'Gold', 'Violet' which sound like consumer/private plans.
-- If there are business plans, they might need manual update or specific logic here.
-- For now, default to 'private'.

UPDATE subscription_plans SET plan_type = 'private';
