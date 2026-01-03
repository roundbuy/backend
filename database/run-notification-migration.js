/**
 * Notification Tables Migration Runner
 * 
 * This script creates the notification center tables in MySQL database:
 * - notifications: Admin-created notifications
 * - user_notifications: Delivery and engagement tracking
 * - user_device_tokens: FCM push tokens
 * 
 * Usage: node backend/database/run-notification-migration.js
 */

const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

async function runMigration() {
    console.log('🚀 Starting notification tables migration...\n');

    try {
        // Read the SQL migration file
        const sqlFilePath = path.join(__dirname, 'migrations', 'add_notification_tables.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Remove comments and split by semicolon
        const cleanedSql = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        // Split by semicolon but keep complete statements
        const statements = cleanedSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && stmt.toUpperCase().includes('CREATE TABLE'));

        console.log(`📄 Found ${statements.length} CREATE TABLE statements to execute\n`);

        // Execute each CREATE TABLE statement
        for (const statement of statements) {
            try {
                // Extract table name for logging
                const tableMatch = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i);
                const tableName = tableMatch ? tableMatch[1] : 'unknown';

                console.log(`⏳ Creating table: ${tableName}...`);

                await promisePool.query(statement);

                console.log(`✅ Success: ${tableName} created\n`);
            } catch (error) {
                // If table already exists, that's okay
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    const tableMatch = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i);
                    const tableName = tableMatch ? tableMatch[1] : 'unknown';
                    console.log(`⚠️  Table ${tableName} already exists, skipping...\n`);
                } else {
                    throw error;
                }
            }
        }

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');

        const [tables] = await promisePool.query(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('notifications', 'user_notifications', 'user_device_tokens')
      ORDER BY TABLE_NAME
    `);

        if (tables.length === 3) {
            console.log('✅ All notification tables verified:\n');
            tables.forEach(table => {
                console.log(`   - ${table.TABLE_NAME} (${table.TABLE_ROWS} rows)`);
            });
            console.log('\n🎉 Migration completed successfully!\n');
        } else {
            console.log(`⚠️  Warning: Expected 3 tables, found ${tables.length}\n`);
            tables.forEach(table => {
                console.log(`   - ${table.TABLE_NAME}`);
            });
        }

        // Show next steps
        console.log('📋 Next Steps:');
        console.log('   1. Install Firebase Admin SDK: npm install firebase-admin --save');
        console.log('   2. Setup Firebase configuration');
        console.log('   3. Create notification services');
        console.log('\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await promisePool.end();
    }
}

// Run migration
runMigration();
