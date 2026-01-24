const { promisePool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running database migration for Stripe integration...\n');

        const sqlFile = path.join(__dirname, '../database/add-stripe-to-plans.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                await promisePool.query(stmt);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Verifying changes...');

        // Verify tables
        const [tables] = await promisePool.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('advertisement_plan_prices', 'banner_plan_prices')
    `);

        console.log(`   ✅ Found ${tables.length} new price tables`);

        // Check columns
        const [adCols] = await promisePool.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'advertisement_plans' 
      AND COLUMN_NAME LIKE 'stripe%'
    `);

        console.log(`   ✅ Added ${adCols.length} Stripe columns to advertisement_plans`);

        const [bannerCols] = await promisePool.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banner_plans' 
      AND COLUMN_NAME LIKE 'stripe%'
    `);

        console.log(`   ✅ Added ${bannerCols.length} Stripe columns to banner_plans`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
    } finally {
        await promisePool.end();
        process.exit();
    }
}

runMigration();
