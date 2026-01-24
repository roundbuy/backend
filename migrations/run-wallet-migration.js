/**
 * Run Wallet System Migration
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '2026-01-22-create-wallet-system.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('📝 Running wallet system migration...\n');

        // Execute migration
        await connection.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify tables created
        const [tables] = await connection.query(`
      SHOW TABLES LIKE 'user_wallets'
      UNION
      SHOW TABLES LIKE 'wallet_transactions'
      UNION
      SHOW TABLES LIKE 'wallet_topup_requests'
      UNION
      SHOW TABLES LIKE 'wallet_withdrawal_requests'
    `);

        console.log('📊 Tables created:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   ✅ ${tableName}`);
        });

        // Check wallets created for users
        const [wallets] = await connection.query(`
      SELECT COUNT(*) as count FROM user_wallets
    `);
        console.log(`\n💰 Wallets created: ${wallets[0].count}`);

        // Show sample wallet
        const [sampleWallets] = await connection.query(`
      SELECT w.id, w.user_id, w.balance, w.currency, u.email
      FROM user_wallets w
      JOIN users u ON w.user_id = u.id
      LIMIT 3
    `);

        if (sampleWallets.length > 0) {
            console.log('\n📋 Sample Wallets:');
            sampleWallets.forEach(wallet => {
                console.log(`   User: ${wallet.email} | Balance: ${wallet.currency} ${wallet.balance}`);
            });
        }

        console.log('\n🎉 Wallet system is ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
