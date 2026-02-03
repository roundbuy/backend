const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function inspectSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [adsColumns] = await connection.query('DESCRIBE advertisements');
        console.log('--- Advertisements Table Columns ---');
        console.table(adsColumns);

        const [planColumns] = await connection.query('DESCRIBE advertisement_plans');
        console.log('\n--- Advertisement Plans Table Columns ---');
        console.table(planColumns);

        const [rewardColumns] = await connection.query('DESCRIBE reward_categories');
        console.log('\n--- Reward Categories Table Columns ---');
        console.table(rewardColumns);

    } catch (error) {
        console.error('Error inspecting schema:', error);
    } finally {
        await connection.end();
    }
}

inspectSchema();
