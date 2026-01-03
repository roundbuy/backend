# How to Run the Issue System Migration

## ✅ **Safe to Run Multiple Times**

This script will:
1. Drop existing `issues`, `issue_evidence`, `issue_messages` tables
2. Remove `escalated_from_issue_id` column from `disputes` (if exists)
3. Create fresh tables
4. Add foreign keys
5. Verify everything was created

---

## 🗄️ **Option 1: Using MySQL Workbench (Recommended)**

1. **Open MySQL Workbench**
2. **Connect to your database**
3. **Open the SQL file:**
   - File → Open SQL Script
   - Navigate to: `backend/database/migrations/create_issue_system.sql`
4. **Execute:**
   - Click the lightning bolt icon ⚡
   - Or press `Cmd + Shift + Enter`
5. **Check results:**
   - You should see "✅ Migration completed successfully!"
   - Tables listed in the output

---

## 🗄️ **Option 2: Using Sequel Pro / TablePlus**

1. **Open your database tool**
2. **Connect to database**
3. **Open Query tab**
4. **Copy and paste** the entire SQL script
5. **Execute** the query
6. **Verify** tables were created

---

## 🗄️ **Option 3: Using phpMyAdmin**

1. **Open phpMyAdmin**
2. **Select your database** (roundbuy)
3. **Click "SQL" tab**
4. **Click "Import files"** or paste the SQL
5. **Click "Go"**
6. **Check for success message**

---

## 🗄️ **Option 4: Using Command Line (if MySQL is accessible)**

```bash
# Navigate to backend directory
cd /Users/ravisvyas/Code/roundbuy-new/backend

# Run the migration
mysql -u root -p roundbuy < database/migrations/create_issue_system.sql

# Enter your MySQL password when prompted
```

**If you get "command not found":**
```bash
# Try with full path
/usr/local/mysql/bin/mysql -u root -p roundbuy < database/migrations/create_issue_system.sql
```

---

## ✅ **Verification**

After running the script, verify tables were created:

### **Check Tables Exist:**
```sql
SHOW TABLES LIKE 'issue%';
```

You should see:
- `issues`
- `issue_evidence`
- `issue_messages`

### **Check Table Structure:**
```sql
DESCRIBE issues;
DESCRIBE issue_evidence;
DESCRIBE issue_messages;
```

### **Check Foreign Keys:**
```sql
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'roundbuy'
AND TABLE_NAME IN ('issues', 'issue_evidence', 'issue_messages')
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### **Check Disputes Table Update:**
```sql
DESCRIBE disputes;
```

Look for `escalated_from_issue_id` column.

---

## 🧪 **Test with Sample Data (Optional)**

After migration, you can insert test data:

```sql
-- Insert a test issue
INSERT INTO issues (
  issue_number,
  advertisement_id,
  product_name,
  created_by,
  other_party_id,
  issue_type,
  issue_description,
  deadline,
  status
) VALUES (
  'ISS00001',
  1,  -- Replace with real ad ID
  'Test Product',
  1,  -- Replace with real buyer ID
  2,  -- Replace with real seller ID
  'quality',
  'Test issue description',
  DATE_ADD(NOW(), INTERVAL 3 DAY),
  'open'
);

-- Verify it was inserted
SELECT * FROM issues;
```

---

## 🚨 **Troubleshooting**

### **Error: "Table doesn't exist"**
- This is OK! It means the table didn't exist before
- The script will create it

### **Error: "Foreign key constraint fails"**
- Make sure `users` and `advertisements` tables exist
- Check that the referenced IDs exist in those tables

### **Error: "Access denied"**
- Check your MySQL username and password
- Make sure you have permission to create/drop tables

### **Error: "Cannot drop table"**
- The script disables foreign key checks first
- If this still happens, manually drop tables:
  ```sql
  SET FOREIGN_KEY_CHECKS = 0;
  DROP TABLE IF EXISTS issue_messages;
  DROP TABLE IF EXISTS issue_evidence;
  DROP TABLE IF EXISTS issues;
  SET FOREIGN_KEY_CHECKS = 1;
  ```

---

## 📊 **What Gets Created**

### **1. issues table**
- Stores all issues between buyers and sellers
- Links to advertisements and users
- Tracks status, deadlines, responses

### **2. issue_evidence table**
- Stores uploaded files (PDF, images)
- Max 3MB per file
- Links to issues and uploaders

### **3. issue_messages table**
- Stores chat messages between parties
- Supports system messages
- Chronological order

### **4. disputes.escalated_from_issue_id**
- New column in disputes table
- Links disputes back to original issues
- Nullable (not all disputes come from issues)

---

## ✅ **Success Indicators**

You'll know it worked when:
1. ✅ No error messages
2. ✅ "Migration completed successfully!" message
3. ✅ Tables appear in your database
4. ✅ Foreign keys are listed
5. ✅ Backend starts without errors

---

## 🔄 **After Migration**

1. **Restart Backend** (if running):
   ```bash
   # It should auto-restart if using nodemon
   # Or manually restart
   ```

2. **Test API Endpoints**:
   - Use Postman or cURL
   - See PHASE-1-BACKEND-COMPLETE.md for examples

3. **Proceed to Phase 2**:
   - Mobile app UI implementation

---

## 📝 **Notes**

- ✅ **Safe to run multiple times** - Script drops and recreates
- ✅ **No data loss** - Only affects issue-related tables
- ✅ **Preserves existing data** - Other tables untouched
- ✅ **Foreign key safe** - Temporarily disables checks

---

**Need help?** Let me know which method you're using and any errors you see!
