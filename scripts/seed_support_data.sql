-- ==========================================
-- Seed Dummy Data for Support & Resolution
-- ==========================================
-- Run this to add test data for the Support & Resolution screen
-- Update user_id = 1 to your actual user ID

-- ==========================================
-- SUPPORT TICKETS
-- ==========================================

INSERT INTO support_tickets (user_id, ticket_number, category, subject, description, status, priority, created_at) VALUES
(1, 'TKT-2024-001', 'deleted_ads', 'My ad was deleted', 'My coffee maker ad was removed. I believe this was a mistake.', 'open', 'high', NOW() - INTERVAL '2 hours'),
(1, 'TKT-2024-002', 'technical', 'App crashes when uploading images', 'The app crashes every time I try to upload more than 3 images.', 'in_progress', 'medium', NOW() - INTERVAL '5 hours'),
(1, 'TKT-2024-003', 'billing', 'Payment not processed', 'I tried to upgrade to Violet membership but payment failed.', 'awaiting_user', 'high', NOW() - INTERVAL '1 day'),
(1, 'TKT-2024-004', 'account', 'Cannot change email address', 'I want to update my email but the form shows an error.', 'resolved', 'low', NOW() - INTERVAL '3 days');

-- ==========================================
-- DELETED ADVERTISEMENTS
-- ==========================================

INSERT INTO deleted_advertisements (user_id, advertisement_id, title, description, deletion_reason, deletion_details, can_appeal, appeal_status, appeal_deadline, deleted_at) VALUES
(1, NULL, 'Sexy woman coffee maker', 'Coffee maker with inappropriate image', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '2 hours'),
(1, NULL, 'Sexy Armchair', 'Armchair with inappropriate title', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '2 hours'),
(1, NULL, 'Armchair "for Sexy People"', 'Armchair with inappropriate description', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '3 hours'),
(1, NULL, 'Coffee maker "with sexy woman pic"', 'Coffee maker with inappropriate image', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '4 hours');

-- ==========================================
-- DISPUTES
-- ==========================================

INSERT INTO disputes (user_id, advertisement_id, dispute_number, type, category, title, description, status, created_at) VALUES
(1, NULL, 'DSP-2024-001', 'exchange', 'item_not_received', 'Pick & Exchange: Arm chair', 'You have confirmed your Exchange with Robbie3. Make sure both parties has received what agreed.', 'pending', NOW() - INTERVAL '2 hours'),
(1, NULL, 'DSP-2024-002', 'exchange', 'item_not_as_described', 'Pick Up & Exchange: Coffee maker', 'You have confirmed your Exchange with RBtester. Make sure both parties has received what agreed.', 'under_review', NOW() - INTERVAL '2 hours'),
(1, NULL, 'DSP-2024-003', 'exchange', 'item_not_received', 'Pick Up & Exchange: Aston Martini', 'You have confirmed your Exchange with DougHot. Make sure both parties has received what agreed.', 'negotiation', NOW() - INTERVAL '3 hours'),
(1, NULL, 'DSP-2024-004', 'exchange', 'item_not_received', 'Pick Up & Exchange: Soccer ball', 'You have confirmed your Exchange with HarryS. Make sure both parties has received what agreed.', 'resolved', NOW() - INTERVAL '4 hours');

-- Update the last dispute with resolution
UPDATE disputes SET resolution_status = 'completed', resolved_at = NOW() - INTERVAL '1 hour' WHERE dispute_number = 'DSP-2024-004';

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Uncomment to verify data was created:

-- SELECT COUNT(*) as ticket_count FROM support_tickets WHERE user_id = 1;
-- SELECT COUNT(*) as deleted_ads_count FROM deleted_advertisements WHERE user_id = 1;
-- SELECT COUNT(*) as disputes_count FROM disputes WHERE user_id = 1;

-- SELECT 'Support Tickets' as type, ticket_number as identifier, subject as title, status FROM support_tickets WHERE user_id = 1
-- UNION ALL
-- SELECT 'Deleted Ads' as type, id::text as identifier, title, appeal_status as status FROM deleted_advertisements WHERE user_id = 1
-- UNION ALL
-- SELECT 'Disputes' as type, dispute_number as identifier, title, status FROM disputes WHERE user_id = 1
-- ORDER BY type, identifier;
