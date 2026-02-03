/**
 * Migration: Add size_type to categories and dimension fields to advertisements
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    let connection;

    try {
        console.log('Connecting with:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME
        });

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database');

        // 1. Add size_type to categories
        const [catColumns] = await connection.query(`SHOW COLUMNS FROM categories LIKE 'size_type'`);
        if (catColumns.length === 0) {
            console.log('📝 Adding size_type column to categories table...');
            await connection.query(`
                ALTER TABLE categories 
                ADD COLUMN size_type ENUM('none', 'dimensions', 'clothing') 
                DEFAULT 'none' 
                AFTER description
            `);
            console.log('✅ size_type added');

            // Migrate existing requires_size data if it exists
            const [reqColumns] = await connection.query(`SHOW COLUMNS FROM categories LIKE 'requires_size'`);
            if (reqColumns.length > 0) {
                console.log('🔄 Migrating requires_size data...');
                await connection.query(`UPDATE categories SET size_type = 'clothing' WHERE requires_size IN ('required', 'optional')`);
                await connection.query(`UPDATE categories SET size_type = 'none' WHERE requires_size = 'not_applicable'`);
                console.log('✅ Data migrated');
            }
        } else {
            console.log('⏭️  Column size_type already exists in categories');
        }

        // 2. Add dimension columns to advertisements
        const [adColumns] = await connection.query(`SHOW COLUMNS FROM advertisements LIKE 'dim_length'`);
        if (adColumns.length === 0) {
            console.log('📝 Adding dimension columns to advertisements table...');
            await connection.query(`
                ALTER TABLE advertisements 
                ADD COLUMN dim_length DECIMAL(10, 2) DEFAULT NULL,
                ADD COLUMN dim_width DECIMAL(10, 2) DEFAULT NULL,
                ADD COLUMN dim_height DECIMAL(10, 2) DEFAULT NULL,
                ADD COLUMN dim_unit VARCHAR(10) DEFAULT 'cm'
            `);
            console.log('✅ Dimension columns added');
        } else {
            console.log('⏭️  Dimension columns already exist in advertisements');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('✅ Database connection closed');
        }
    }
}

runMigration()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    });
