const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDetails() {
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
        const [promos] = await pool.query(
            "SELECT id, advertisement_id, badge_level, priority_level " +
            "FROM product_badges " +
            "WHERE badge_level IN ('rise_to_top', 'top_spot', 'fast', 'targeted') AND is_active = 1"
        );
        console.log("PROMOS:", JSON.stringify(promos, null, 2));

        const [showcases] = await pool.query(
            "SELECT id, advertisement_id, badge_level, showcase_group_id " +
            "FROM product_badges " +
            "WHERE badge_level = 'show_casing' AND is_active = 1 " +
            "LIMIT 5"
        );
        console.log("SHOWCASES:", JSON.stringify(showcases, null, 2));

        const [homemarkets] = await pool.query(
            "SELECT id, advertisement_id, badge_level, priority_level " +
            "FROM product_badges " +
            "WHERE badge_level IN ('homemarket-gold-7-days', 'homemarket-orange-7-days', 'homemarket-green-7-days') AND is_active = 1 " +
            "LIMIT 5"
        );
        console.log("HOMEMARKETS:", JSON.stringify(homemarkets, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkDetails();
