/**
 * Database Debug Script
 * Run these queries in your database tool to check campaign notification flow
 */

-- 1. Check if trigger was created
SELECT 
    id,
    campaign_notification_id,
    user_id,
    scheduled_at,
    trigger_status,
    sent_at,
    created_at
FROM campaign_notification_triggers
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if user notification was created
SELECT 
    id as user_notification_id,
    user_id,
    campaign_notification_id,
    trigger_id,
    delivered_at,
    is_read
FROM user_campaign_notifications
ORDER BY delivered_at DESC
LIMIT 5;

-- 3. Check campaign notifications are active
SELECT 
    id,
    type_key,
    category,
    is_active,
    collapsed_title
FROM campaign_notifications
WHERE is_active = TRUE
LIMIT 5;

-- 4. Check your user ID
SELECT id, email, full_name FROM users ORDER BY created_at DESC LIMIT 5;
