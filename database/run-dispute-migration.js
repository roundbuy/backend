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
        const migrationPath = path.join(__dirname, 'migrations', 'add_dispute_fields.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('Running migration: add_dispute_fields.sql');

        // Execute migration
        const [results] = await connection.query(sql);

        console.log('✓ Migration completed successfully!');
        console.log('Added fields:');
        console.log('  - seller_response (TEXT)');
        console.log('  - seller_decision (ENUM: accept, decline)');
        console.log('  - type (VARCHAR)');
        console.log('  - seller_id (INT with FK)');
        console.log('  - buyer_demand (TEXT)');
        console.log('  - issue_id (INT with FK)');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ Database connection closed');
        }
    }
}

runMigration();
