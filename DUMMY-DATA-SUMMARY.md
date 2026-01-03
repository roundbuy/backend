# Dummy Data Created for Support & Resolution ✅

## Files Created

### 1. SQL Script
**File:** `backend/scripts/seed_support_data.sql`

Quick way to add dummy data to your database.

### 2. Node.js Script  
**File:** `backend/scripts/seedSupportData.js`

Alternative script using Node.js.

### 3. Documentation
**File:** `backend/SEED-SUPPORT-DATA.md`

Complete instructions and examples.

## Quick Start

### Option 1: Run SQL Script (Easiest)

```bash
cd /Users/ravisvyas/Code/roundbuy-new/backend

# Connect to your database and run the script
psql -U your_username -d roundbuy_db -f scripts/seed_support_data.sql
```

### Option 2: Copy-Paste SQL

Open your database client and run this:

```sql
-- Support Tickets (4 items)
INSERT INTO support_tickets (user_id, ticket_number, category, subject, description, status, priority, created_at) VALUES
(1, 'TKT-2024-001', 'deleted_ads', 'My ad was deleted', 'My coffee maker ad was removed. I believe this was a mistake.', 'open', 'high', NOW() - INTERVAL '2 hours'),
(1, 'TKT-2024-002', 'technical', 'App crashes when uploading images', 'The app crashes every time I try to upload more than 3 images.', 'in_progress', 'medium', NOW() - INTERVAL '5 hours'),
(1, 'TKT-2024-003', 'billing', 'Payment not processed', 'I tried to upgrade to Violet membership but payment failed.', 'awaiting_user', 'high', NOW() - INTERVAL '1 day'),
(1, 'TKT-2024-004', 'account', 'Cannot change email address', 'I want to update my email but the form shows an error.', 'resolved', 'low', NOW() - INTERVAL '3 days');

-- Deleted Ads (4 items)
INSERT INTO deleted_advertisements (user_id, advertisement_id, title, description, deletion_reason, deletion_details, can_appeal, appeal_status, appeal_deadline, deleted_at) VALUES
(1, NULL, 'Sexy woman coffee maker', 'Coffee maker with inappropriate image', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '2 hours'),
(1, NULL, 'Sexy Armchair', 'Armchair with inappropriate title', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '2 hours'),
(1, NULL, 'Armchair "for Sexy People"', 'Armchair with inappropriate description', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '3 hours'),
(1, NULL, 'Coffee maker "with sexy woman pic"', 'Coffee maker with inappropriate image', 'policy_violation', 'Your ad has been removed as having Forbidden content (text or images). Please try again.', true, 'not_appealed', NOW() + INTERVAL '7 days', NOW() - INTERVAL '4 hours');

-- Disputes (4 items)
INSERT INTO disputes (user_id, advertisement_id, dispute_number, type, category, title, description, status, created_at) VALUES
(1, NULL, 'DSP-2024-001', 'exchange', 'item_not_received', 'Pick & Exchange: Arm chair', 'You have confirmed your Exchange with Robbie3. Make sure both parties has received what agreed.', 'pending', NOW() - INTERVAL '2 hours'),
(1, NULL, 'DSP-2024-002', 'exchange', 'item_not_as_described', 'Pick Up & Exchange: Coffee maker', 'You have confirmed your Exchange with RBtester. Make sure both parties has received what agreed.', 'under_review', NOW() - INTERVAL '2 hours'),
(1, NULL, 'DSP-2024-003', 'exchange', 'item_not_received', 'Pick Up & Exchange: Aston Martini', 'You have confirmed your Exchange with DougHot. Make sure both parties has received what agreed.', 'negotiation', NOW() - INTERVAL '3 hours'),
(1, NULL, 'DSP-2024-004', 'exchange', 'item_not_received', 'Pick Up & Exchange: Soccer ball', 'You have confirmed your Exchange with HarryS. Make sure both parties has received what agreed.', 'resolved', NOW() - INTERVAL '4 hours');

UPDATE disputes SET resolution_status = 'completed', resolved_at = NOW() - INTERVAL '1 hour' WHERE dispute_number = 'DSP-2024-004';
```

## What Gets Created

### Support Tickets (4 items)

| Ticket # | Subject | Status | Priority | Time |
|----------|---------|--------|----------|------|
| TKT-2024-001 | My ad was deleted | Open | High | 2h ago |
| TKT-2024-002 | App crashes when uploading | In Progress | Medium | 5h ago |
| TKT-2024-003 | Payment not processed | Awaiting User | High | 1d ago |
| TKT-2024-004 | Cannot change email | Resolved | Low | 3d ago |

### Deleted Ads (4 items)

| Title | Reason | Status | Time |
|-------|--------|--------|------|
| Sexy woman coffee maker | Policy Violation | Not Appealed | 2h ago |
| Sexy Armchair | Policy Violation | Not Appealed | 2h ago |
| Armchair "for Sexy People" | Policy Violation | Not Appealed | 3h ago |
| Coffee maker "with sexy woman pic" | Policy Violation | Not Appealed | 4h ago |

### Disputes (4 items)

| Dispute # | Title | Status | Time |
|-----------|-------|--------|------|
| DSP-2024-001 | Pick & Exchange: Arm chair | Pending | 2h ago |
| DSP-2024-002 | Pick Up & Exchange: Coffee maker | Under Review | 2h ago |
| DSP-2024-003 | Pick Up & Exchange: Aston Martini | Negotiation | 3h ago |
| DSP-2024-004 | Pick Up & Exchange: Soccer ball | Resolved | 4h ago |

## Important Notes

### User ID
All data uses `user_id = 1`. To use your actual user:

1. Find your user ID:
```sql
SELECT id, email FROM users WHERE email = 'your@email.com';
```

2. Replace `user_id = 1` with your actual ID

### Advertisement IDs
All `advertisement_id` values are `NULL`. You can:
- Leave as NULL (works fine for testing)
- Update with real ad IDs if needed

### Timestamps
All timestamps are relative:
- `NOW() - INTERVAL '2 hours'` = 2 hours ago
- `NOW() - INTERVAL '1 day'` = 1 day ago
- `NOW() + INTERVAL '7 days'` = 7 days from now

## Verify Data

After running, check the data:

```sql
-- Count records
SELECT 
  (SELECT COUNT(*) FROM support_tickets WHERE user_id = 1) as tickets,
  (SELECT COUNT(*) FROM deleted_advertisements WHERE user_id = 1) as deleted_ads,
  (SELECT COUNT(*) FROM disputes WHERE user_id = 1) as disputes;

-- View all data
SELECT 'Ticket' as type, ticket_number as id, subject as title, status 
FROM support_tickets WHERE user_id = 1
UNION ALL
SELECT 'Deleted Ad', id::text, title, appeal_status 
FROM deleted_advertisements WHERE user_id = 1
UNION ALL
SELECT 'Dispute', dispute_number, title, status 
FROM disputes WHERE user_id = 1
ORDER BY type, id;
```

## Test in App

After seeding data:

1. **Open App**
2. **Navigate:** User Account → Support & Resolution
3. **Test Tabs:**

**My support:**
- All → Should show 8 items (4 tickets + 4 deleted ads)
- Deleted ads → Should show 4 items
- Ads appeals → Should show 0 items (none created yet)
- Tickets → Should show 4 items

**Resolution center:**
- All → Should show 4 items
- Exchanges → Should show 0 items (create separately if needed)
- Issues → Should show 0 items (create separately if needed)
- Disputes → Should show 4 items
- Ended → Should show 1 item (the resolved dispute)

## Troubleshooting

### If tables don't exist:

You need to create the tables first. Check if you have migrations or create them manually.

### If getting errors:

1. Check user_id exists:
```sql
SELECT id FROM users WHERE id = 1;
```

2. Check table structure:
```sql
\d support_tickets
\d deleted_advertisements
\d disputes
```

3. Adjust column names if needed

## Summary

**Created:**
- ✅ 4 Support Tickets
- ✅ 4 Deleted Ads
- ✅ 4 Disputes

**Files:**
- ✅ `scripts/seed_support_data.sql` - SQL script
- ✅ `scripts/seedSupportData.js` - Node.js script
- ✅ `SEED-SUPPORT-DATA.md` - Documentation

**Next Steps:**
1. Run the SQL script
2. Verify data in database
3. Test in the app

Dummy data ready for testing! 🎉
