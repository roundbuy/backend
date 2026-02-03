const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function alterTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Modify badge_type to VARCHAR(50)
        await connection.query('ALTER TABLE product_badges MODIFY COLUMN badge_type VARCHAR(50) NOT NULL');
        console.log('Table `product_badges` altered successfully.');

    } catch (error) {
        console.error('Error altering table:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

alterTable();
