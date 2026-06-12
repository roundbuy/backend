#!/usr/bin/env node
/**
 * RoundBuy Postage Tables Migration Runner
 * Run: node backend/database/run_postage_migration.js
 */

const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'roundbuy_db',
        multipleStatements: true
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);

    const sql = fs.readFileSync(path.join(__dirname, 'create_postage_tables.sql'), 'utf8');

    // Split on semicolons but skip empty statements
    const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

    let created = 0;
    let seeded = 0;

    for (const stmt of statements) {
        if (!stmt) continue;
        try {
            await connection.execute(stmt);
            if (stmt.toUpperCase().startsWith('CREATE')) created++;
            else if (stmt.toUpperCase().startsWith('INSERT')) seeded++;
        } catch (err) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.message.includes('Duplicate entry')) {
                // Ignore already-exists errors
            } else {
                console.error('⚠️  Statement error:', err.message);
                console.error('   Statement:', stmt.substring(0, 100) + '...');
            }
        }
    }

    console.log(`✅ Migration complete: ${created} tables created/verified, ${seeded} seed statements run`);

    // Verify
    const [carriers] = await connection.execute('SELECT COUNT(*) as count FROM shipping_carriers');
    const [zones] = await connection.execute('SELECT COUNT(*) as count FROM shipping_zones');
    const [rates] = await connection.execute('SELECT COUNT(*) as count FROM shipping_rates');

    console.log(`📦 Carriers: ${carriers[0].count}`);
    console.log(`🌍 Zones: ${zones[0].count}`);
    console.log(`💰 Rates: ${rates[0].count}`);

    await connection.end();
}

runMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
