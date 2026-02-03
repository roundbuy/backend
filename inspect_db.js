
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function inspect() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        // 1. Check Tables
        console.log('\n--- Existing Tables ---');
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(tableNames.join(', '));

        // 2. Check Users Table Columns
        console.log('\n--- Users Table Columns ---');
        const [userColumns] = await connection.query('DESCRIBE users');
        const hasReferralCode = userColumns.some(c => c.Field === 'referral_code');
        console.log('referral_code column exists:', hasReferralCode);
        if (!hasReferralCode) {
            // console.log('Columns:', userColumns.map(c => c.Field).join(', '));
        }

        // 3. Check Users Table Status (Collation/Engine)
        console.log('\n--- Users Table Status ---');
        const [userStatus] = await connection.query("SHOW TABLE STATUS WHERE Name = 'users'");
        console.log('Engine:', userStatus[0]?.Engine);
        console.log('Collation:', userStatus[0]?.Collation);

        // 4. Check if referrals table exists
        if (tableNames.includes('referrals')) {
            console.log('\n--- Referrals Table exists ---');
        } else {
            console.log('\n--- Referrals Table MISSING ---');
        }

    } catch (error) {
        console.error('Inspection failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

inspect();
