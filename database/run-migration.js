const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        console.log('Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_gender_to_sizes.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: add_gender_to_sizes.sql');

        // Execute migration
        await connection.query(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('\nChanges made:');
        console.log('- Added gender_id column to ad_sizes table');
        console.log('- Added foreign key constraint to ad_genders');
        console.log('- Inserted gender-specific sizes (Men, Women, Children)');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
}

runMigration();
