const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrationFile = path.join(__dirname, '../database/migrations/add_plan_type_to_subs_plans.sql');

async function runMigration() {
    console.log('Starting migration...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'roundbuy_db',
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log('Executing SQL:', sql);
        await connection.query(sql);
        console.log('Migration successful.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
