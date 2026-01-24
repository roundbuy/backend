const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Starting visibility plans migration...\n');

    // Create connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'roundbuy',
        multipleStatements: true
    });

    try {
        // Read SQL file
        const sqlFile = path.join(__dirname, 'database', 'setup-visibility-plans.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📄 Executing migration SQL...\n');

        // Execute SQL
        await connection.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify the data
        console.log('📊 Verifying inserted data...\n');

        const [plans] = await connection.query(
            'SELECT plan_type, COUNT(*) as count FROM advertisement_plans GROUP BY plan_type'
        );

        console.log('Advertisement Plans by Type:');
        plans.forEach(plan => {
            console.log(`  - ${plan.plan_type}: ${plan.count} plans`);
        });

        const [boosts] = await connection.query(
            'SELECT COUNT(*) as count FROM distance_boost_plans'
        );
        console.log(`\nDistance Boost Plans: ${boosts[0].count}`);

        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('advertisement_plans', 'distance_boost_plans', 'advertisement_promotions')
        `, [process.env.DB_NAME || 'roundbuy']);

        console.log('\n✅ Tables created:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });

        console.log('\n🎉 All done! The visibility plans system is ready to use.\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
