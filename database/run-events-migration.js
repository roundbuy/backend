require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runEventsMigration() {
    let connection;
    try {
        console.log('🚀 Starting Events and KYC migration...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        const sqlFile = path.join(__dirname, 'migrations', '003_events_and_kyc_enhancements.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📝 Executing SQL statements...\n');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!\n');
        
        // Verify tables
        console.log('📋 Verifying new tables...');
        const [tables] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name IN ('events', 'event_followers', 'event_participants', 'kyc_records')
        `);

        console.log(`Found ${tables.length} tables:`);
        tables.forEach(table => console.log(`   - ${table.table_name}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runEventsMigration();
