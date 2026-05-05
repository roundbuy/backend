const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLocations() {
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
        const [locs] = await pool.query(
            "SELECT advertisement_id, location_id " +
            "FROM advertisement_locations " +
            "WHERE advertisement_id IN (19, 20, 21, 22, 32, 23, 24, 25, 26, 27, 9, 10, 11, 12, 13)"
        );
        console.log("AD LOCATIONS:", JSON.stringify(locs, null, 2));

        const [allLocs] = await pool.query("SELECT COUNT(*) as count FROM advertisement_locations");
        console.log("TOTAL ROWS IN advertisement_locations:", allLocs[0].count);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkLocations();
