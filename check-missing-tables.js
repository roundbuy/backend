const { promisePool } = require('./src/config/database');
const fs = require('fs').promises;
const path = require('path');

async function findMissingTables() {
    try {
        console.log('🔍 Checking for missing database tables...\n');

        // Get all tables from database
        const [dbTables] = await promisePool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

        const existingTables = new Set(dbTables.map(t => t.TABLE_NAME));
        console.log(`📊 Found ${existingTables.size} tables in database\n`);

        // Scan backend code for table references
        const controllersDir = './src/controllers';
        const tablesInCode = new Set();
        const tableUsage = {};

        async function scanDirectory(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (entry.name.endsWith('.js')) {
                    const content = await fs.readFile(fullPath, 'utf-8');

                    // Find SQL queries with table names
                    const patterns = [
                        /FROM\s+`?(\w+)`?/gi,
                        /INTO\s+`?(\w+)`?/gi,
                        /UPDATE\s+`?(\w+)`?/gi,
                        /JOIN\s+`?(\w+)`?/gi,
                        /TABLE\s+`?(\w+)`?/gi,
                    ];

                    patterns.forEach(pattern => {
                        let match;
                        while ((match = pattern.exec(content)) !== null) {
                            const tableName = match[1];
                            // Filter out SQL keywords and variables
                            if (!['SELECT', 'WHERE', 'AND', 'OR', 'SET', 'VALUES', 'NULL', 'TRUE', 'FALSE', 'ON', 'AS'].includes(tableName.toUpperCase())) {
                                tablesInCode.add(tableName);

                                if (!tableUsage[tableName]) {
                                    tableUsage[tableName] = [];
                                }
                                if (!tableUsage[tableName].includes(fullPath)) {
                                    tableUsage[tableName].push(fullPath);
                                }
                            }
                        }
                    });
                }
            }
        }

        await scanDirectory(controllersDir);

        console.log(`📝 Found ${tablesInCode.size} table references in backend code\n`);

        // Find missing tables
        const missingTables = [];
        const unusedTables = [];

        tablesInCode.forEach(table => {
            if (!existingTables.has(table)) {
                missingTables.push(table);
            }
        });

        existingTables.forEach(table => {
            if (!tablesInCode.has(table)) {
                unusedTables.push(table);
            }
        });

        // Report
        console.log('='.repeat(70));
        console.log('🚨 MISSING TABLES (Referenced in code but not in database)');
        console.log('='.repeat(70));

        if (missingTables.length > 0) {
            missingTables.sort().forEach(table => {
                console.log(`\n❌ ${table}`);
                console.log(`   Used in:`);
                tableUsage[table].forEach(file => {
                    console.log(`   - ${file.replace('./src/controllers/', '')}`);
                });
            });
        } else {
            console.log('✅ No missing tables found!');
        }

        console.log('\n' + '='.repeat(70));
        console.log('📭 UNUSED TABLES (In database but not referenced in code)');
        console.log('='.repeat(70));

        if (unusedTables.length > 0) {
            unusedTables.sort().forEach(table => {
                console.log(`⚠️  ${table}`);
            });
        } else {
            console.log('✅ All tables are used!');
        }

        // Check schema files for table definitions
        console.log('\n' + '='.repeat(70));
        console.log('📄 CHECKING SCHEMA FILES');
        console.log('='.repeat(70));

        const schemaFiles = [
            './database/schema.sql',
            './database/schema/disputes_and_support.sql',
            './database/schema/claims.sql',
            './database/messaging_system_changes.sql'
        ];

        const tablesInSchema = new Set();

        for (const schemaFile of schemaFiles) {
            try {
                const content = await fs.readFile(schemaFile, 'utf-8');
                const createTablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/gi;

                let match;
                while ((match = createTablePattern.exec(content)) !== null) {
                    tablesInSchema.add(match[1]);
                }

                console.log(`✅ ${schemaFile.replace('./database/', '')}`);
            } catch (err) {
                console.log(`⚠️  ${schemaFile.replace('./database/', '')} - Not found`);
            }
        }

        console.log(`\n📊 Total tables defined in schema files: ${tablesInSchema.size}`);

        // Find tables in schema but not in database
        const notCreated = [];
        tablesInSchema.forEach(table => {
            if (!existingTables.has(table)) {
                notCreated.push(table);
            }
        });

        if (notCreated.length > 0) {
            console.log('\n' + '='.repeat(70));
            console.log('⚠️  TABLES IN SCHEMA BUT NOT CREATED IN DATABASE');
            console.log('='.repeat(70));
            notCreated.sort().forEach(table => {
                console.log(`❌ ${table}`);
            });
        }

        // Save detailed report
        const report = {
            analyzedAt: new Date().toISOString(),
            summary: {
                tablesInDatabase: existingTables.size,
                tablesInCode: tablesInCode.size,
                tablesInSchema: tablesInSchema.size,
                missingTables: missingTables.length,
                unusedTables: unusedTables.length,
                notCreatedFromSchema: notCreated.length
            },
            missingTables: missingTables.map(t => ({
                table: t,
                usedIn: tableUsage[t]
            })),
            unusedTables: unusedTables,
            notCreatedFromSchema: notCreated,
            allTablesInDatabase: Array.from(existingTables).sort(),
            allTablesInCode: Array.from(tablesInCode).sort(),
            allTablesInSchema: Array.from(tablesInSchema).sort()
        };

        await fs.writeFile('./missing-tables-report.json', JSON.stringify(report, null, 2));
        console.log('\n✅ Detailed report saved to: missing-tables-report.json\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

findMissingTables();
