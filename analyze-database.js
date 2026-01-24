const { promisePool } = require('./src/config/database');
const fs = require('fs').promises;

async function analyzeDatabaseSchema() {
    try {
        console.log('🔍 Analyzing RoundBuy Database Schema...\n');

        // Get all tables
        const [tables] = await promisePool.query(`
      SELECT TABLE_NAME, TABLE_ROWS, 
             ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS SIZE_MB
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

        console.log(`📊 Found ${tables.length} tables\n`);

        const analysis = {
            database: 'roundbuy_db',
            totalTables: tables.length,
            analyzedAt: new Date().toISOString(),
            tables: {}
        };

        // Analyze each table
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            console.log(`📋 Analyzing: ${tableName}...`);

            // Get columns
            const [columns] = await promisePool.query(`
        SELECT 
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA,
          COLUMN_COMMENT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);

            // Get foreign keys
            const [foreignKeys] = await promisePool.query(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [tableName]);

            // Get indexes
            const [indexes] = await promisePool.query(`
        SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          AND INDEX_NAME != 'PRIMARY'
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [tableName]);

            // Get sample row count
            const [countResult] = await promisePool.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
            const actualRowCount = countResult[0].count;

            // Get sample data (first 3 rows) for important tables
            let sampleData = null;
            const importantTables = [
                'subscription_plans', 'currencies', 'countries', 'languages',
                'categories', 'ad_activities', 'ad_conditions', 'settings'
            ];

            if (importantTables.includes(tableName) && actualRowCount > 0) {
                const [samples] = await promisePool.query(`SELECT * FROM ?? LIMIT 3`, [tableName]);
                sampleData = samples;
            }

            analysis.tables[tableName] = {
                rowCount: actualRowCount,
                estimatedRows: table.TABLE_ROWS,
                sizeInMB: table.SIZE_MB,
                columns: columns.map(col => ({
                    name: col.COLUMN_NAME,
                    type: col.COLUMN_TYPE,
                    nullable: col.IS_NULLABLE === 'YES',
                    key: col.COLUMN_KEY,
                    default: col.COLUMN_DEFAULT,
                    extra: col.EXTRA,
                    comment: col.COLUMN_COMMENT
                })),
                foreignKeys: foreignKeys.map(fk => ({
                    column: fk.COLUMN_NAME,
                    references: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
                    constraint: fk.CONSTRAINT_NAME
                })),
                indexes: indexes.reduce((acc, idx) => {
                    if (!acc[idx.INDEX_NAME]) {
                        acc[idx.INDEX_NAME] = {
                            columns: [],
                            unique: idx.NON_UNIQUE === 0,
                            type: idx.INDEX_TYPE
                        };
                    }
                    acc[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
                    return acc;
                }, {}),
                sampleData: sampleData
            };
        }

        // Save to JSON file
        const outputPath = './database-analysis.json';
        await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
        console.log(`\n✅ Analysis complete! Saved to: ${outputPath}`);

        // Print summary
        console.log('\n📊 DATABASE SUMMARY:');
        console.log('='.repeat(60));
        console.log(`Total Tables: ${analysis.totalTables}`);

        // Group tables by category
        const categories = {
            'Core': ['users', 'countries', 'currencies', 'languages'],
            'Subscriptions': ['subscription_plans', 'user_subscriptions', 'plan_prices', 'saved_payment_methods'],
            'Advertisements': ['advertisements', 'advertisement_plans', 'categories', 'user_locations'],
            'Filters': ['ad_activities', 'ad_conditions', 'ad_ages', 'ad_genders', 'ad_sizes', 'ad_colors'],
            'Messaging': ['conversations', 'messages', 'offers'],
            'Support': ['disputes', 'dispute_messages', 'dispute_evidence', 'dispute_eligibility_checks', 'dispute_resolutions',
                'claims', 'claim_messages', 'claim_evidence',
                'support_tickets', 'support_ticket_messages', 'support_ticket_attachments',
                'deleted_advertisements'],
            'System': ['translations', 'translation_keys', 'moderation_words', 'moderation_queue',
                'settings', 'notifications', 'api_logs', 'admin_activity_logs'],
            'Other': ['products', 'orders', 'order_items', 'reviews', 'favorites', 'banners', 'banner_plans']
        };

        for (const [category, tableNames] of Object.entries(categories)) {
            const categoryTables = tableNames.filter(name => analysis.tables[name]);
            if (categoryTables.length > 0) {
                console.log(`\n${category}:`);
                categoryTables.forEach(name => {
                    const table = analysis.tables[name];
                    console.log(`  - ${name.padEnd(35)} (${table.rowCount} rows, ${table.columns.length} columns)`);
                });
            }
        }

        // Check for Stripe configuration
        console.log('\n🔑 STRIPE CONFIGURATION CHECK:');
        console.log('='.repeat(60));
        const [stripeSettings] = await promisePool.query(`
      SELECT setting_key, setting_value 
      FROM settings 
      WHERE setting_key LIKE '%stripe%'
    `);

        if (stripeSettings.length > 0) {
            stripeSettings.forEach(setting => {
                const value = setting.setting_value;
                const isEmpty = !value || value === '""' || value === "''";
                const status = isEmpty ? '❌ EMPTY' : '✅ SET';
                console.log(`  ${setting.setting_key.padEnd(30)} ${status}`);
            });
        } else {
            console.log('  ⚠️  No Stripe settings found in database');
        }

        // Check subscription plans
        console.log('\n💳 SUBSCRIPTION PLANS:');
        console.log('='.repeat(60));
        const [plans] = await promisePool.query(`
      SELECT id, name, slug, price, duration_days, 
             stripe_product_id, stripe_price_id
      FROM subscription_plans
      ORDER BY sort_order
    `);

        plans.forEach(plan => {
            const hasStripe = plan.stripe_product_id && plan.stripe_price_id;
            const stripeStatus = hasStripe ? '✅' : '❌';
            console.log(`  ${plan.name.padEnd(15)} $${plan.price.toString().padEnd(8)} ${plan.duration_days} days  Stripe: ${stripeStatus}`);
        });

        // Check for empty/unused tables
        console.log('\n📭 EMPTY TABLES:');
        console.log('='.repeat(60));
        const emptyTables = Object.entries(analysis.tables)
            .filter(([name, data]) => data.rowCount === 0)
            .map(([name]) => name);

        if (emptyTables.length > 0) {
            emptyTables.forEach(name => console.log(`  - ${name}`));
        } else {
            console.log('  ✅ All tables have data');
        }

        console.log('\n✨ Done!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error analyzing database:', error);
        process.exit(1);
    }
}

analyzeDatabaseSchema();
