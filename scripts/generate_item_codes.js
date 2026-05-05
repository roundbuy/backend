require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function generateItemCodes() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('Connected to database');

        const tables = ['advertisements', 'products'];

        for (const table of tables) {
            console.log(`Processing table: ${table}`);
            const [items] = await connection.query(`SELECT id FROM ${table} WHERE item_code IS NULL`);
            console.log(`Found ${items.length} items without codes`);

            for (const item of items) {
                let code;
                let exists = true;
                
                // Keep generating until unique
                while (exists) {
                    code = 'RB-' + crypto.randomBytes(3).toString('hex').toUpperCase();
                    const [dup] = await connection.query(`SELECT id FROM ${table} WHERE item_code = ?`, [code]);
                    if (dup.length === 0) exists = false;
                }

                await connection.query(`UPDATE ${table} SET item_code = ? WHERE id = ?`, [code, item.id]);
            }
            console.log(`✅ Updated ${items.length} items in ${table}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to generate codes:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

generateItemCodes();
