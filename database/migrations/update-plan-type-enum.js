const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function updatePlanTypeEnum() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Alter the plan_type ENUM to include 'home_market'
        const alterQuery = `
            ALTER TABLE advertisement_plans 
            MODIFY COLUMN plan_type ENUM('rise_to_top', 'top_spot', 'show_casing', 'targeted', 'fast', 'home_market') NOT NULL
        `;

        await connection.query(alterQuery);
        console.log('✅ Updated plan_type ENUM to include "home_market"');

        // Verify the change
        const [columns] = await connection.query(
            `SHOW COLUMNS FROM advertisement_plans LIKE 'plan_type'`
        );

        console.log('\n📋 Updated column definition:');
        console.log(`   Type: ${columns[0].Type}`);

    } catch (error) {
        console.error('❌ Error updating ENUM:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnection closed.');
        }
    }
}

// Run the migration
updatePlanTypeEnum()
    .then(() => {
        console.log('\n✅ ENUM update completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ ENUM update failed:', error);
        process.exit(1);
    });
