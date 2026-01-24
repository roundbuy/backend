-- Add requires_size field to categories table
-- This controls whether size selection is required, optional, or not applicable for each category

ALTER TABLE categories 
ADD COLUMN requires_size ENUM('required', 'optional', 'not_applicable') 
DEFAULT 'not_applicable' 
AFTER description;

-- Set Fashion & Clothing categories to require sizes
-- Update these IDs based on your actual category IDs for fashion/clothing
UPDATE categories 
SET requires_size = 'required' 
WHERE name IN ('Fashion', 'Clothing', 'Apparel', 'Clothes');

-- Set Hunting, Horse Riding, Sports to optional (they can use clothing sizes but not required)
UPDATE categories 
SET requires_size = 'optional' 
WHERE name IN ('Hunting', 'Horse Riding', 'Sports', 'Equestrian', 'Outdoor Sports');

-- All other categories remain 'not_applicable' by default
