const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAds() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'roundbuy_db',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const [ads] = await pool.query(
            "SELECT id, title, status " +
            "FROM advertisements " +
            "WHERE id IN (19, 20, 21, 22, 32, 23, 24, 25, 26, 27, 9, 10, 11, 12, 13)"
        );
        console.log("ADS WITH BADGES:", JSON.stringify(ads, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkAds();
