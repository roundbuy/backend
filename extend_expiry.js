const mysql = require('mysql2/promise');
require('dotenv').config();

async function extendExpiry() {
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
        const [badgeResult] = await pool.query(
            "UPDATE product_badges SET expiry_date = '2026-12-31 23:59:59' WHERE expiry_date IS NOT NULL AND expiry_date < NOW()"
        );
        console.log("Extended badges expiry:", badgeResult.affectedRows);

        const [bannerResult] = await pool.query(
            "UPDATE banners SET end_date = '2026-12-31 23:59:59' WHERE end_date IS NOT NULL AND end_date < NOW()"
        );
        console.log("Extended banners expiry:", bannerResult.affectedRows);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

extendExpiry();
