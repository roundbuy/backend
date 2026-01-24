-- Add setting for backend payment tokenization
-- This enables secure server-side card tokenization to avoid Stripe dashboard restrictions

INSERT INTO settings (category, setting_key, setting_value, description, created_at, updated_at)
VALUES (
  'payment',
  'use_backend_tokenization',
  'true',
  'Enable backend payment tokenization (recommended for security and to avoid Stripe restrictions)',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  setting_value = 'true',
  description = 'Enable backend payment tokenization (recommended for security and to avoid Stripe restrictions)',
  updated_at = NOW();
