const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkExpiry() {
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
        const [badg] = await pool.query(
            "SELECT id, advertisement_id, badge_level, is_active, expiry_date " +
            "FROM product_badges " +
            "WHERE badge_level IN ('rise_to_top', 'top_spot', 'fast', 'targeted', 'show_casing', 'homemarket-gold-7-days', 'homemarket-orange-7-days', 'homemarket-green-7-days') " +
            "AND is_active = 1"
        );
        console.log("BADGES EXPIRY:", JSON.stringify(badg, null, 2));

        const [now] = await pool.query("SELECT NOW() as current_time");
        console.log("DB CURRENT TIME:", now[0].current_time);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkExpiry();
