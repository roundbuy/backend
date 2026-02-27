const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy_db'
};

// Luton Airport Coordinates
const LUTON_LAT = 51.8763;
const LUTON_LON = -0.3717;
const RADIUS_KM = 3;

/**
 * Generate random coordinates within radius
 */
function getRandomCoordinates(centerLat, centerLon, radiusKm) {
    const r = radiusKm / 111.32; // Convert km to degrees (rough approximation)
    const y0 = centerLat;
    const x0 = centerLon;

    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y1 = w * Math.sin(t);

    // Adjust longitude for latitude
    const newLat = y0 + y1;
    const newLon = x0 + (x / Math.cos(y0 * (Math.PI / 180)));

    return { lat: newLat, lon: newLon };
}

async function updateAdsLocation() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected.');

        // 1. Get all users who have published ads
        const [users] = await connection.query(`
            SELECT DISTINCT u.id, u.email 
            FROM users u
            JOIN advertisements a ON u.id = a.user_id
            WHERE a.status = 'published'
        `);

        console.log(`📊 Found ${users.length} users with published ads.`);

        let totalAdsUpdated = 0;

        for (const user of users) {
            // 2. Create a new location for this user near Luton
            const coords = getRandomCoordinates(LUTON_LAT, LUTON_LON, RADIUS_KM);

            // Insert location
            const [locResult] = await connection.query(`
                INSERT INTO user_locations 
                (user_id, name, street, city, country, zip_code, latitude, longitude, is_active, is_default, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, NOW(), NOW())
            `, [
                user.id,
                'Luton Airport Area',
                'Airport Way',
                'Luton',
                'UK',
                'LU2 9LY',
                coords.lat,
                coords.lon
            ]);

            const locationId = locResult.insertId;
            console.log(`   📍 Created location for ${user.email} (ID: ${locationId}) at [${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}]`);

            // 3. Update all published ads for this user to use this location
            const [updateResult] = await connection.query(`
                UPDATE advertisements 
                SET location_id = ? 
                WHERE user_id = ? AND status = 'published'
            `, [locationId, user.id]);

            console.log(`      Updated ${updateResult.affectedRows} ads.`);
            totalAdsUpdated += updateResult.affectedRows;
        }

        console.log(`\n✅ Successfully updated ${totalAdsUpdated} ads for ${users.length} users to Luton Airport area.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateAdsLocation();
