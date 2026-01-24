-- Add new languages to the system
-- Run this migration to add all requested languages

INSERT INTO languages (code, name, is_active) VALUES
-- Germanic Languages
('de', 'German', TRUE),
('sv', 'Swedish', TRUE),
('no', 'Norwegian', TRUE),
('is', 'Icelandic', TRUE),
('fi', 'Finnish', TRUE),

-- Slavic Languages
('pl', 'Polish', TRUE),
('lv', 'Latvian', TRUE),
('lt', 'Lithuanian', TRUE),
('bg', 'Bulgarian', TRUE),

-- Asian Languages
('ja', 'Japanese', TRUE),
('zh-CN', 'Chinese (Mandarin)', TRUE),
('zh-HK', 'Chinese (Cantonese)', TRUE),
('ko', 'Korean', TRUE),
('ar', 'Arabic', TRUE),

-- Romance Languages
('it', 'Italian', TRUE),
('pt', 'Portuguese', TRUE)

ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    is_active = VALUES(is_active);
