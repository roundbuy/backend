# Run Dummy Data Script (MySQL) ✅

## Quick Start

### Option 1: Using MySQL Command Line

```bash
cd /Users/ravisvyas/Code/roundbuy-new/backend

# Run the script
mysql -u root -p roundbuy_db < scripts/seed_support_data_mysql.sql
```

### Option 2: Copy-Paste in MySQL Workbench or phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Select database: `roundbuy_db`
3. Open `scripts/seed_support_data_mysql.sql`
4. Copy all the SQL
5. Paste and execute

### Option 3: Using .env credentials

```bash
# If you have DB credentials in .env
mysql -h localhost -u your_username -p roundbuy_db < scripts/seed_support_data_mysql.sql
```

## Important: Update User ID

Before running, find your user ID:

```sql
SELECT id, email FROM users WHERE email = 'your@email.com';
```

Then replace all `user_id = 1` in the SQL file with your actual ID.

## What Gets Created

**Support Tickets:** 4 items
- TKT-2024-001: My ad was deleted (Open)
- TKT-2024-002: App crashes (In Progress)
- TKT-2024-003: Payment not processed (Awaiting User)
- TKT-2024-004: Cannot change email (Resolved)

**Deleted Ads:** 4 items
- Sexy woman coffee maker
- Sexy Armchair
- Armchair "for Sexy People"
- Coffee maker "with sexy woman pic"

**Disputes:** 4 items
- Pick & Exchange: Arm chair (Pending)
- Pick Up & Exchange: Coffee maker (Under Review)
- Pick Up & Exchange: Aston Martini (Negotiation)
- Pick Up & Exchange: Soccer ball (Resolved)

## Verify Data

After running:

```sql
SELECT COUNT(*) as tickets FROM support_tickets WHERE user_id = 1;
SELECT COUNT(*) as deleted_ads FROM deleted_advertisements WHERE user_id = 1;
SELECT COUNT(*) as disputes FROM disputes WHERE user_id = 1;
```

Should return:
- tickets: 4
- deleted_ads: 4
- disputes: 4

## MySQL Syntax Differences

The script uses MySQL-specific syntax:
- `DATE_SUB(NOW(), INTERVAL 2 HOUR)` instead of PostgreSQL's `NOW() - INTERVAL '2 hours'`
- `DATE_ADD(NOW(), INTERVAL 7 DAY)` instead of `NOW() + INTERVAL '7 days'`
- `1` instead of `true` for boolean values
- `CAST(id AS CHAR)` instead of `id::text`

## Troubleshooting

### If tables don't exist:

Check if tables exist:
```sql
SHOW TABLES LIKE '%support%';
SHOW TABLES LIKE '%dispute%';
SHOW TABLES LIKE '%deleted%';
```

### If getting column errors:

Check table structure:
```sql
DESCRIBE support_tickets;
DESCRIBE deleted_advertisements;
DESCRIBE disputes;
```

Adjust column names in the SQL if needed.

### If user_id doesn't exist:

```sql
-- Check users
SELECT id, email FROM users LIMIT 10;

-- Use the correct user_id
```

## Summary

**File:** `scripts/seed_support_data_mysql.sql`

**Command:**
```bash
mysql -u root -p roundbuy_db < scripts/seed_support_data_mysql.sql
```

**Result:** 12 dummy records (4 tickets + 4 deleted ads + 4 disputes)

Ready to test in the app! 🎉
