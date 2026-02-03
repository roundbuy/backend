const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function createProductBadgesTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Create product_badges table
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS product_badges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            advertisement_id INT NOT NULL,
            badge_type ENUM('visibility', 'reward') NOT NULL,
            badge_level VARCHAR(50) NOT NULL COMMENT 'e.g., gold, silver, urgent, featured',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
            INDEX idx_product_badges_ad_id (advertisement_id),
            INDEX idx_product_badges_type (badge_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(createTableQuery);
        console.log('Table `product_badges` created or already exists.');

    } catch (error) {
        console.error('Error creating product_badges table:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

createProductBadgesTable();
