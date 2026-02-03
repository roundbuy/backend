
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function inspect() {
    let connection;
    try {
        console.log('Connecting to database...', dbConfig.database);
        connection = await mysql.createConnection(dbConfig);

        const tablesoToCheck = ['pickup_schedules', 'pickup_fees'];

        console.log('\n--- Checking Tables ---');
        const [tables] = await connection.query('SHOW TABLES');
        const existingTables = tables.map(t => Object.values(t)[0]);
        console.log('All Tables:', existingTables.join(', '));

        for (const table of tablesoToCheck) {
            if (existingTables.includes(table)) {
                console.log(`\n--- ${table} Schema ---`);
                const [columns] = await connection.query(`DESCRIBE ${table}`);
                console.log(columns.map(c => `${c.Field} (${c.Type})`).join(', '));
            } else {
                console.log(`\n--- ${table} DOES NOT EXIST ---`);
            }
        }

    } catch (error) {
        console.error('Inspection failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

inspect();
