const { promisePool } = require('./src/config/database');
const fs = require('fs').promises;

async function createMissingTables() {
    try {
        console.log('🔧 Creating missing database tables...\n');

        // Read the SQL file
        const sqlContent = await fs.readFile('./database/create-missing-tables.sql', 'utf-8');

        // Remove comments and split properly
        const lines = sqlContent.split('\n');
        let currentStatement = '';
        const statements = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip comment lines
            if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.length === 0) {
                continue;
            }

            currentStatement += ' ' + line;

            // Check if statement ends with semicolon
            if (trimmed.endsWith(';')) {
                const stmt = currentStatement.trim().slice(0, -1); // Remove semicolon
                if (stmt.length > 0) {
                    statements.push(stmt);
                }
                currentStatement = '';
            }
        }

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        let created = 0;
        let errors = 0;
        let skipped = 0;

        for (const statement of statements) {
            // Extract table name from CREATE TABLE statement
            const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
            const tableName = match ? match[1] : 'Unknown';

            try {
                if (statement.toUpperCase().includes('CREATE TABLE')) {
                    console.log(`Creating table: ${tableName}...`);
                    await promisePool.query(statement);
                    created++;
                    console.log(`✅ ${tableName} created successfully`);
                } else if (statement.toUpperCase().includes('INSERT INTO')) {
                    const insertMatch = statement.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
                    const insertTable = insertMatch ? insertMatch[1] : 'table';
                    console.log(`Inserting data into ${insertTable}...`);
                    await promisePool.query(statement);
                    console.log(`✅ Data inserted`);
                } else if (statement.toUpperCase().includes('SELECT')) {
                    // Skip verification queries
                    skipped++;
                    continue;
                }
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`⚠️  ${tableName} already exists`);
                    skipped++;
                } else {
                    console.error(`❌ Error with ${tableName}:`, error.message);
                    errors++;
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Tables created: ${created}`);
        console.log(`⚠️  Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);

        // Verify all tables now exist
        console.log('\n' + '='.repeat(70));
        console.log('🔍 VERIFICATION');
        console.log('='.repeat(70));

        const tablesToCheck = [
            'api_logs',
            'banner_plans',
            'banners',
            'dispute_resolutions',
            'moderation_queue',
            'moderation_words',
            'translation_keys',
            'translations'
        ];

        let allExist = true;
        for (const table of tablesToCheck) {
            const [result] = await promisePool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
      `, [table]);

            if (result[0].count > 0) {
                console.log(`✅ ${table.padEnd(25)} EXISTS`);
            } else {
                console.log(`❌ ${table.padEnd(25)} MISSING`);
                allExist = false;
            }
        }

        if (allExist) {
            console.log('\n🎉 All required tables now exist!\n');
        } else {
            console.log('\n⚠️  Some tables are still missing. Check errors above.\n');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

createMissingTables();
