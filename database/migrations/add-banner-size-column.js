const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function addBannerSizeColumn() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Add size column to banners table
        const alterQuery = `
            ALTER TABLE banners 
            ADD COLUMN IF NOT EXISTS size ENUM('small', 'medium', 'large') DEFAULT 'medium' AFTER link_url
        `;

        await connection.query(alterQuery);
        console.log('✅ Added size column to banners table');

        // Also update placement ENUM to include 'search_listing'
        const updatePlacementQuery = `
            ALTER TABLE banners 
            MODIFY COLUMN placement ENUM('home_top', 'home_sidebar', 'category_page', 'product_detail', 'footer', 'search_listing') NOT NULL
        `;

        await connection.query(updatePlacementQuery);
        console.log('✅ Updated placement ENUM to include "search_listing"');

    } catch (error) {
        console.error('❌ Error updating banners table:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnection closed.');
        }
    }
}

// Run the migration
addBannerSizeColumn()
    .then(() => {
        console.log('\n✅ Banners table update completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Banners table update failed:', error);
        process.exit(1);
    });
