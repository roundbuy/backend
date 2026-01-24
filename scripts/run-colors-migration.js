const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✓ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/2026-01-21-add-colors-system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('✓ Migration file loaded');
        console.log('\nExecuting colors system migration...\n');

        // Execute migration
        await connection.query(migrationSQL);

        console.log('✓ Migration executed successfully!');
        console.log('\nAdded:');
        console.log('  - colors table');
        console.log('  - color_shades table');
        console.log('  - 15 base colors');
        console.log('  - 45 color shades (Light/Medium/Dark for each)');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        if (error.message.includes('already exists')) {
            console.log('\n⚠️  Tables may already exist. Check database manually.');
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
