/**
 * Verify Wallet Tables
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTables() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database\n');

        // Check each table
        const tables = ['user_wallets', 'wallet_transactions', 'wallet_topup_requests', 'wallet_withdrawal_requests'];

        console.log('📊 Checking tables:');
        for (const tableName of tables) {
            const [result] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
            if (result.length > 0) {
                const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`   ✅ ${tableName} (${count[0].count} rows)`);
            } else {
                console.log(`   ❌ ${tableName} NOT FOUND`);
            }
        }

        // Show sample wallets
        const [wallets] = await connection.query(`
      SELECT w.id, w.user_id, w.balance, w.currency, u.email
      FROM user_wallets w
      JOIN users u ON w.user_id = u.id
      LIMIT 5
    `);

        if (wallets.length > 0) {
            console.log('\n💰 Sample Wallets:');
            wallets.forEach(wallet => {
                console.log(`   User: ${wallet.email.padEnd(30)} | Balance: ${wallet.currency} ${wallet.balance.toFixed(2)}`);
            });
        }

        console.log('\n🎉 Wallet system is ready!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyTables();
