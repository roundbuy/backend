const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

/**
 * Add showcase_group_id to product_badges for grouping showcase products
 */
async function addShowcaseGrouping() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.\n');

        // Check if column already exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'product_badges' 
              AND COLUMN_NAME = 'showcase_group_id'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('⚠️  Column showcase_group_id already exists, skipping...');
        } else {
            // Add showcase_group_id column
            await connection.query(`
                ALTER TABLE product_badges 
                ADD COLUMN showcase_group_id VARCHAR(50) DEFAULT NULL 
                COMMENT 'Groups products in same showcase (format: user_id_timestamp)'
                AFTER badge_level
            `);
            console.log('✅ Added showcase_group_id column');

            // Add index
            await connection.query(`
                ALTER TABLE product_badges 
                ADD INDEX idx_showcase_group (showcase_group_id)
            `);
            console.log('✅ Added index on showcase_group_id');
        }

        // Check current badge_type enum
        const [tableInfo] = await connection.query(`
            SHOW COLUMNS FROM product_badges WHERE Field = 'badge_type'
        `);

        const currentType = tableInfo[0].Type;
        console.log('\n📋 Current badge_type:', currentType);

        // Update badge_type enum if needed (already has show_casing from schema)
        if (!currentType.includes('show_casing')) {
            console.log('⚠️  show_casing not in enum, this should not happen with current schema');
        } else {
            console.log('✅ badge_type enum already includes show_casing');
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run migration
addShowcaseGrouping();
