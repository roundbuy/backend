const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        console.log('✓ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_seller_fields.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('Running migration: add_seller_fields.sql\n');

        // Execute migration
        await connection.query(sql);

        console.log('✓ Migration completed successfully!\n');
        console.log('Added fields to disputes table:');
        console.log('  ✓ seller_id (INT with FK to users)');
        console.log('  ✓ seller_response (TEXT)');
        console.log('  ✓ seller_decision (ENUM: accept, decline)');
        console.log('  ✓ buyer_demand (TEXT)');
        console.log('  ✓ Index on (seller_id, status)');
        console.log('\nYou can now:');
        console.log('  - Track who the seller/respondent is');
        console.log('  - Store seller\'s response to disputes');
        console.log('  - Record seller\'s decision (accept/decline)');
        console.log('  - Store buyer\'s demand/request');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n⚠️  Some fields may already exist. This is OK.');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

runMigration();
