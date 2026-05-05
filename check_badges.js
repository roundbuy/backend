const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBadges() {
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
        const [rows] = await pool.query(
            "SELECT id, advertisement_id, badge_type, badge_level, is_active, showcase_group_id, created_at " +
            "FROM product_badges " +
            "ORDER BY created_at DESC " +
            "LIMIT 20;"
        );
        console.log("LAST 20 BADGES:", JSON.stringify(rows, null, 2));

        const [showcaseCount] = await pool.query(
            "SELECT COUNT(*) as count FROM product_badges WHERE badge_level = 'show_casing' AND is_active = 1"
        );
        console.log('Active showcasing badges:', showcaseCount[0].count);

        const [promoCount] = await pool.query(
            "SELECT COUNT(*) as count FROM product_badges " +
            "WHERE badge_level IN ('rise_to_top', 'top_spot', 'fast', 'targeted') AND is_active = 1"
        );
        console.log('Active promo badges:', promoCount[0].count);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkBadges();
