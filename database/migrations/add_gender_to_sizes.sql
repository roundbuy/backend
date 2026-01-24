-- Migration: Add gender_id to ad_sizes table
-- Date: 2026-01-20

-- Step 1: Add gender_id column to ad_sizes table
ALTER TABLE ad_sizes 
ADD COLUMN gender_id INT DEFAULT NULL COMMENT 'Gender category for this size' AFTER slug,
ADD INDEX idx_gender_id (gender_id),
ADD CONSTRAINT fk_ad_sizes_gender 
  FOREIGN KEY (gender_id) REFERENCES ad_genders(id) ON DELETE SET NULL;

-- Step 2: Clear existing sizes (optional - only if you want to replace them)
-- DELETE FROM ad_sizes;

-- Step 3: Insert sizes with static names but dynamic gender_id references
-- Get gender IDs dynamically from ad_genders table
SET @male_id = (SELECT id FROM ad_genders WHERE slug = 'male' LIMIT 1);
SET @female_id = (SELECT id FROM ad_genders WHERE slug = 'female' LIMIT 1);
SET @other_id = (SELECT id FROM ad_genders WHERE slug = 'other' LIMIT 1);

-- Insert sizes with static names linked to dynamic gender IDs
INSERT INTO ad_sizes (name, slug, gender_id, sort_order) VALUES
-- Men's sizes (static names, dynamic gender_id)
('Men XS', 'men-xs', @male_id, 1),
('Men S', 'men-s', @male_id, 2),
('Men M', 'men-m', @male_id, 3),
('Men L', 'men-l', @male_id, 4),
('Men XL', 'men-xl', @male_id, 5),
('Men XXL', 'men-xxl', @male_id, 6),
-- Women's sizes (static names, dynamic gender_id)
('Women XS', 'women-xs', @female_id, 7),
('Women S', 'women-s', @female_id, 8),
('Women M', 'women-m', @female_id, 9),
('Women L', 'women-l', @female_id, 10),
('Women XL', 'women-xl', @female_id, 11),
('Women XXL', 'women-xxl', @female_id, 12),
-- Children's sizes (static names, dynamic gender_id)
('Children XS', 'children-xs', @other_id, 13),
('Children S', 'children-s', @other_id, 14),
('Children M', 'children-m', @other_id, 15),
('Children L', 'children-l', @other_id, 16),
('Children XL', 'children-xl', @other_id, 17)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  gender_id = VALUES(gender_id),
  sort_order = VALUES(sort_order);
