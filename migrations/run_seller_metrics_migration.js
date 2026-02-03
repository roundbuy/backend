
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...', dbConfig.database);
        connection = await mysql.createConnection(dbConfig);

        const sqlPath = path.join(__dirname, 'create_seller_metrics.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await connection.query(sql);
        console.log('Migration executed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
