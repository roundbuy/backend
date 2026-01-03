# Seed Support & Resolution Dummy Data

## Quick SQL Script

Run this SQL directly in your database to add dummy data:

```sql
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

-- Update the last one with resolution
UPDATE disputes SET resolution_status = 'completed', resolved_at = NOW() - INTERVAL '1 hour' WHERE dispute_number = 'DSP-2024-004';
```

## How to Run

### Option 1: Using psql
```bash
cd /Users/ravisvyas/Code/roundbuy-new/backend
psql -U your_username -d roundbuy_db -f scripts/seed_support_data.sql
```

### Option 2: Direct SQL
1. Connect to your database
2. Copy and paste the SQL above
3. Execute

### Option 3: Using Node Script
```bash
cd /Users/ravisvyas/Code/roundbuy-new/backend
node scripts/seedSupportData.js
```

## What Gets Created

### Support Tickets (4 items)
- ✅ TKT-2024-001: My ad was deleted (Open, High priority)
- ✅ TKT-2024-002: App crashes (In Progress, Medium priority)
- ✅ TKT-2024-003: Payment not processed (Awaiting User, High priority)
- ✅ TKT-2024-004: Cannot change email (Resolved, Low priority)

### Deleted Ads (4 items)
- ✅ Sexy woman coffee maker (2h ago)
- ✅ Sexy Armchair (2h ago)
- ✅ Armchair "for Sexy People" (3h ago)
- ✅ Coffee maker "with sexy woman pic" (4h ago)

### Disputes (4 items)
- ✅ Pick & Exchange: Arm chair (Pending, 2h ago)
- ✅ Pick Up & Exchange: Coffee maker (Under Review, 2h ago)
- ✅ Pick Up & Exchange: Aston Martini (Negotiation, 3h ago)
- ✅ Pick Up & Exchange: Soccer ball (Resolved, 4h ago)

## Verify Data

After running, verify the data was created:

```sql
-- Check tickets
SELECT id, ticket_number, subject, status FROM support_tickets WHERE user_id = 1;

-- Check deleted ads
SELECT id, title, deletion_reason, appeal_status FROM deleted_advertisements WHERE user_id = 1;

-- Check disputes
SELECT id, dispute_number, title, status FROM disputes WHERE user_id = 1;
```

## Update User ID

The script uses `user_id = 1`. To use your actual user ID:

1. Find your user ID:
```sql
SELECT id, email FROM users WHERE email = 'your@email.com';
```

2. Replace all `user_id = 1` with your actual ID in the SQL

## Notes

- All timestamps are relative (2h ago, 3h ago, etc.)
- Advertisement IDs are NULL (you can update with real ad IDs if needed)
- Appeal deadlines are set to 7 days from now
- One dispute is marked as resolved with resolution_status

## Testing in App

After seeding:
1. Open app
2. Go to User Account
3. Tap "Support & Resolution"
4. Switch between tabs:
   - My support → All, Deleted ads, Tickets
   - Resolution center → All, Exchanges, Disputes, Ended

You should see the dummy data! 🎉
