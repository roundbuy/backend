// Fix favorites table to use advertisements instead of products
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixFavoritesTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('✅ Connected to database');

        // Drop existing favorites table
        console.log('🗑️  Dropping old favorites table...');
        await connection.execute('DROP TABLE IF EXISTS favorites');

        // Create new favorites table with advertisement_id
        console.log('📝 Creating new favorites table...');
        await connection.execute(`
      CREATE TABLE favorites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        advertisement_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,

        -- Indexes for performance
        INDEX idx_user_id (user_id),
        INDEX idx_advertisement_id (advertisement_id),
        INDEX idx_user_ad (user_id, advertisement_id),

        -- Ensure no duplicate favorites
        UNIQUE KEY unique_user_advertisement (user_id, advertisement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ Favorites table created successfully');

        // Verify table structure
        const [columns] = await connection.execute('DESCRIBE favorites');
        console.log('\n📋 New table structure:');
        columns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type})`);
        });

        await connection.end();
        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

fixFavoritesTable();
