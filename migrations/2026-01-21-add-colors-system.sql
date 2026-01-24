-- Migration: Add colors and color shades system
-- Date: 2026-01-21
-- Description: Create colors and color_shades tables for enhanced color selection

START TRANSACTION;

-- Create colors table
CREATE TABLE IF NOT EXISTS colors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  hex_code VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create color_shades table
CREATE TABLE IF NOT EXISTS color_shades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  color_id INT NOT NULL,
  shade ENUM('light', 'medium', 'dark') NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_color_shade (color_id, shade)
);

-- Insert base colors
INSERT INTO colors (name, hex_code) VALUES
('Red', '#FF0000'),
('Blue', '#0000FF'),
('Green', '#008000'),
('Yellow', '#FFFF00'),
('Orange', '#FFA500'),
('Purple', '#800080'),
('Pink', '#FFC0CB'),
('Brown', '#8B4513'),
('Black', '#000000'),
('White', '#FFFFFF'),
('Grey', '#808080'),
('Beige', '#F5F5DC'),
('Navy', '#000080'),
('Maroon', '#800000'),
('Teal', '#008080');

-- Insert color shades (Light, Medium, Dark for each color)
-- Red shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(1, 'light', 'Light Red', '#FF6666'),
(1, 'medium', 'Medium Red', '#FF0000'),
(1, 'dark', 'Dark Red', '#CC0000');

-- Blue shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(2, 'light', 'Light Blue', '#6666FF'),
(2, 'medium', 'Medium Blue', '#0000FF'),
(2, 'dark', 'Dark Blue', '#0000CC');

-- Green shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(3, 'light', 'Light Green', '#66B266'),
(3, 'medium', 'Medium Green', '#008000'),
(3, 'dark', 'Dark Green', '#006600');

-- Yellow shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(4, 'light', 'Light Yellow', '#FFFF99'),
(4, 'medium', 'Medium Yellow', '#FFFF00'),
(4, 'dark', 'Dark Yellow', '#CCCC00');

-- Orange shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(5, 'light', 'Light Orange', '#FFD699'),
(5, 'medium', 'Medium Orange', '#FFA500'),
(5, 'dark', 'Dark Orange', '#CC8400');

-- Purple shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(6, 'light', 'Light Purple', '#B266B2'),
(6, 'medium', 'Medium Purple', '#800080'),
(6, 'dark', 'Dark Purple', '#660066');

-- Pink shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(7, 'light', 'Light Pink', '#FFE0E6'),
(7, 'medium', 'Medium Pink', '#FFC0CB'),
(7, 'dark', 'Dark Pink', '#FF69B4');

-- Brown shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(8, 'light', 'Light Brown', '#C19A6B'),
(8, 'medium', 'Medium Brown', '#8B4513'),
(8, 'dark', 'Dark Brown', '#654321');

-- Black shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(9, 'light', 'Light Black', '#333333'),
(9, 'medium', 'Medium Black', '#000000'),
(9, 'dark', 'Dark Black', '#000000');

-- White shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(10, 'light', 'Light White', '#FFFFFF'),
(10, 'medium', 'Medium White', '#FFFFFF'),
(10, 'dark', 'Dark White', '#F0F0F0');

-- Grey shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(11, 'light', 'Light Grey', '#C0C0C0'),
(11, 'medium', 'Medium Grey', '#808080'),
(11, 'dark', 'Dark Grey', '#404040');

-- Beige shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(12, 'light', 'Light Beige', '#FFFACD'),
(12, 'medium', 'Medium Beige', '#F5F5DC'),
(12, 'dark', 'Dark Beige', '#D2B48C');

-- Navy shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(13, 'light', 'Light Navy', '#4D4DCC'),
(13, 'medium', 'Medium Navy', '#000080'),
(13, 'dark', 'Dark Navy', '#000066');

-- Maroon shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(14, 'light', 'Light Maroon', '#B26666'),
(14, 'medium', 'Medium Maroon', '#800000'),
(14, 'dark', 'Dark Maroon', '#660000');

-- Teal shades
INSERT INTO color_shades (color_id, shade, display_name, hex_code) VALUES
(15, 'light', 'Light Teal', '#66B2B2'),
(15, 'medium', 'Medium Teal', '#008080'),
(15, 'dark', 'Dark Teal', '#006666');

COMMIT;

-- Rollback (commented):
-- START TRANSACTION;
-- DROP TABLE IF EXISTS color_shades;
-- DROP TABLE IF EXISTS colors;
-- COMMIT;
