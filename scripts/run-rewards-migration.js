const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('Reading migration file...');
        const sqlPath = path.join(__dirname, '../database/create-rewards-tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('Executing migration...');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('Created tables: reward_categories, referrals, user_rewards_progress, lottery_winners, popular_searches');
        console.log('Added column: users.referral_code');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
