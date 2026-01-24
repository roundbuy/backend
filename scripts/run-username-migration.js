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
        const migrationPath = path.join(__dirname, '../migrations/2026-01-21-add-username-column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('✓ Migration file loaded');
        console.log('\nExecuting migration...\n');

        // Execute migration
        await connection.query(migrationSQL);

        console.log('✓ Migration executed successfully!');
        console.log('\nAdded:');
        console.log('  - username column to users table');
        console.log('  - unique constraint on username');
        console.log('  - index on username');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

runMigration();
