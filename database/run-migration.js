require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

async function runMigration() {
    try {
        console.log('🚀 Starting Phase 1 migration...\n');

        // Read the SQL file
        const sqlFile = path.join(__dirname, 'migrations', '001_phase1_issues_and_deadlines.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolon and filter out comments and empty statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments and DELIMITER statements
            if (statement.startsWith('--') ||
                statement.includes('DELIMITER') ||
                statement.trim() === '') {
                continue;
            }

            try {
                await promisePool.query(statement);
                successCount++;

                // Log progress for important statements
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.includes('ALTER TABLE')) {
                    const tableName = statement.match(/ALTER TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Altered table: ${tableName}`);
                } else if (statement.includes('CREATE FUNCTION')) {
                    const funcName = statement.match(/CREATE FUNCTION.*?(\w+)\(/)?.[1];
                    console.log(`✅ Created function: ${funcName}`);
                } else if (statement.includes('CREATE PROCEDURE')) {
                    const procName = statement.match(/CREATE PROCEDURE.*?(\w+)\(/)?.[1];
                    console.log(`✅ Created procedure: ${procName}`);
                } else if (statement.includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/CREATE TRIGGER.*?(\w+)/)?.[1];
                    console.log(`✅ Created trigger: ${triggerName}`);
                }
            } catch (error) {
                // Some errors are expected (like "table already exists")
                if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
                    error.code === 'ER_DUP_FIELDNAME' ||
                    error.sqlMessage?.includes('already exists')) {
                    console.log(`⚠️  Skipped (already exists): ${error.sqlMessage?.substring(0, 60)}...`);
                } else {
                    errorCount++;
                    console.error(`❌ Error executing statement ${i + 1}:`, error.sqlMessage || error.message);
                }
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`\n✨ Phase 1 migration completed!\n`);

        // Verify the tables were created
        const [tables] = await promisePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('issues', 'dispute_claims', 'issue_messages')
    `);

        console.log('📋 Verified tables:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.table_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
