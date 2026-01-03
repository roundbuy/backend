require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

async function runSimpleMigration() {
    try {
        console.log('🚀 Starting Phase 1 migration (simplified)...\n');

        const sqlFile = path.join(__dirname, 'migrations', '001_phase1_simple.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolon
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Executing ${statements.length} SQL statements...\n`);

        for (const statement of statements) {
            if (!statement || statement.startsWith('--')) continue;

            try {
                await promisePool.query(statement);

                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.includes('ALTER TABLE') && statement.includes('ADD COLUMN')) {
                    const tableName = statement.match(/ALTER TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Added columns to table: ${tableName}`);
                } else if (statement.includes('ALTER TABLE') && statement.includes('ADD CONSTRAINT')) {
                    console.log(`✅ Added foreign key constraint`);
                } else if (statement.includes('ALTER TABLE') && statement.includes('ADD INDEX')) {
                    console.log(`✅ Added indexes`);
                } else if (statement.includes('SELECT')) {
                    const [result] = await promisePool.query(statement);
                    console.log(`\n${result[0].status}\n`);
                }
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
                    console.log(`⚠️  Table already exists: ${tableName}`);
                } else if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠️  Column already exists (skipping)`);
                } else if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️  Index already exists (skipping)`);
                } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log(`⚠️  Key doesn't exist (skipping)`);
                } else {
                    console.error(`❌ Error:`, error.sqlMessage || error.message);
                }
            }
        }

        // Verify tables
        console.log('\n📋 Verifying tables...');
        const [tables] = await promisePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('issues', 'dispute_claims', 'issue_messages')
    `);

        if (tables.length === 3) {
            console.log('✅ All tables created successfully:');
            tables.forEach(table => console.log(`   - ${table.table_name}`));
        } else {
            console.log(`⚠️  Only ${tables.length}/3 tables found`);
        }

        // Verify columns in disputes table
        const [columns] = await promisePool.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'disputes' 
      AND COLUMN_NAME IN ('issue_id', 'dispute_deadline', 'claim_deadline', 'resolution_deadline', 'current_phase')
    `);

        console.log(`\n✅ Added ${columns.length}/5 new columns to disputes table`);

        console.log('\n✨ Migration completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runSimpleMigration();
