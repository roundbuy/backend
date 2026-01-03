const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDisputesTable() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('✓ Connected to database\n');

        // Get table structure
        const [columns] = await connection.query('DESCRIBE disputes');

        console.log('Current disputes table structure:');
        console.log('=====================================');
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(30)} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDisputesTable();
