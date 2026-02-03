const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function checkBadges() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [rows] = await connection.query('SELECT * FROM product_badges LIMIT 5');
        console.log(`Found ${rows.length} badges in DB:`);
        console.log(JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            const [ad] = await connection.query('SELECT id, title FROM advertisements WHERE id = ?', [rows[0].advertisement_id]);
            console.log('Associated Ad:', JSON.stringify(ad[0], null, 2));
        }

    } catch (error) {
        console.error('Error checking badges:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

checkBadges();
