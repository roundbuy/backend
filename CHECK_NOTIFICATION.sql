-- Quick check if campaign notification was delivered
-- Run this in your database tool

-- 1. Check user_campaign_notifications table
SELECT 
    ucn.id as user_notification_id,
    ucn.user_id,
    ucn.campaign_notification_id,
    cn.type_key,
    cn.collapsed_title,
    ucn.delivered_at,
    ucn.is_read
FROM user_campaign_notifications ucn
JOIN campaign_notifications cn ON ucn.campaign_notification_id = cn.id
ORDER BY ucn.delivered_at DESC
LIMIT 5;

-- 2. Check triggers status
SELECT 
    id,
    user_id,
    campaign_notification_id,
    trigger_status,
    sent_at,
    created_at
FROM campaign_notification_triggers
ORDER BY created_at DESC
LIMIT 5;

-- 3. If you see a notification, test heartbeat with this user_id
-- The notification should appear in the heartbeat response!
