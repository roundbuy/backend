/**
 * Migration: Add status and updated_at to advertisement_feedbacks
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

        // Check columns
        const [columns] = await connection.query(`SHOW COLUMNS FROM advertisement_feedbacks LIKE 'status'`);

        if (columns.length === 0) {
            console.log('📝 Adding status column...');
            await connection.query(`
                ALTER TABLE advertisement_feedbacks 
                ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER is_visible
            `);
            console.log('✅ status column added');
        } else {
            console.log('⏭️  status column already exists');
        }

        const [updatedAt] = await connection.query(`SHOW COLUMNS FROM advertisement_feedbacks LIKE 'updated_at'`);
        if (updatedAt.length === 0) {
            console.log('📝 Adding updated_at column...');
            await connection.query(`
                ALTER TABLE advertisement_feedbacks 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
            console.log('✅ updated_at column added');
        } else {
            console.log('⏭️  updated_at column already exists');
        }

        // Initialize existing feedbacks to approved if they were visible
        console.log('🔄 initializing status for existing feedbacks...');
        await connection.query(`UPDATE advertisement_feedbacks SET status = 'approved' WHERE is_visible = 1 AND status = 'pending'`);
        console.log('✅ Existing visible feedbacks set to approved');

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
