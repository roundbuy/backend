const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function alterProductBadgesTable() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_badges'
        `, [dbConfig.database]);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('📋 Existing columns:', existingColumns);

        // Add expiry_date column if it doesn't exist
        if (!existingColumns.includes('expiry_date')) {
            console.log('➕ Adding expiry_date column...');
            await connection.query(`
                ALTER TABLE product_badges 
                ADD COLUMN expiry_date DATETIME DEFAULT NULL 
                COMMENT 'When badge expires, NULL for permanent badges'
            `);
            console.log('✅ Added expiry_date column');
        } else {
            console.log('⏭️  expiry_date column already exists');
        }

        // Add priority_level column if it doesn't exist
        if (!existingColumns.includes('priority_level')) {
            console.log('➕ Adding priority_level column...');
            await connection.query(`
                ALTER TABLE product_badges 
                ADD COLUMN priority_level INT DEFAULT 0 
                COMMENT 'Priority for search ordering (higher = more priority)'
            `);
            console.log('✅ Added priority_level column');
        } else {
            console.log('⏭️  priority_level column already exists');
        }

        // Check if indexes exist
        const [indexes] = await connection.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_badges'
        `, [dbConfig.database]);

        const existingIndexes = indexes.map(idx => idx.INDEX_NAME);
        console.log('📋 Existing indexes:', existingIndexes);

        // Add index on expiry_date if it doesn't exist
        if (!existingIndexes.includes('idx_expiry_date')) {
            console.log('➕ Adding index on expiry_date...');
            await connection.query(`
                ALTER TABLE product_badges 
                ADD INDEX idx_expiry_date (expiry_date)
            `);
            console.log('✅ Added index on expiry_date');
        } else {
            console.log('⏭️  idx_expiry_date index already exists');
        }

        // Add index on priority_level if it doesn't exist
        if (!existingIndexes.includes('idx_priority_level')) {
            console.log('➕ Adding index on priority_level...');
            await connection.query(`
                ALTER TABLE product_badges 
                ADD INDEX idx_priority_level (priority_level)
            `);
            console.log('✅ Added index on priority_level');
        } else {
            console.log('⏭️  idx_priority_level index already exists');
        }

        // Update badge_type enum to include 'membership' if not already present
        console.log('🔄 Checking badge_type enum values...');
        const [enumInfo] = await connection.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'product_badges' 
              AND COLUMN_NAME = 'badge_type'
        `, [dbConfig.database]);

        if (enumInfo.length > 0) {
            const enumValues = enumInfo[0].COLUMN_TYPE;
            console.log('📋 Current badge_type enum:', enumValues);

            if (!enumValues.includes('membership')) {
                console.log('➕ Adding "membership" to badge_type enum...');
                await connection.query(`
                    ALTER TABLE product_badges 
                    MODIFY COLUMN badge_type ENUM('visibility', 'reward', 'membership') NOT NULL
                `);
                console.log('✅ Updated badge_type enum');
            } else {
                console.log('⏭️  badge_type enum already includes "membership"');
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Final schema:');
        const [finalSchema] = await connection.query('DESCRIBE product_badges');
        console.table(finalSchema);

    } catch (error) {
        console.error('❌ Error altering product_badges table:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed.');
        }
    }
}

// Run migration
alterProductBadgesTable();
