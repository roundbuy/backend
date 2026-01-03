const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSellerFields() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('✓ Connected to database\n');
        console.log('Adding seller fields to disputes table...\n');

        // Add seller_id
        try {
            await connection.query(`
        ALTER TABLE disputes 
        ADD COLUMN seller_id INT NULL
      `);
            console.log('✓ Added seller_id column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  seller_id already exists');
            } else throw e;
        }

        // Add buyer_demand
        try {
            await connection.query(`
        ALTER TABLE disputes 
        ADD COLUMN buyer_demand TEXT NULL
      `);
            console.log('✓ Added buyer_demand column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  buyer_demand already exists');
            } else throw e;
        }

        // Add seller_response
        try {
            await connection.query(`
        ALTER TABLE disputes 
        ADD COLUMN seller_response TEXT NULL
      `);
            console.log('✓ Added seller_response column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  seller_response already exists');
            } else throw e;
        }

        // Add seller_decision
        try {
            await connection.query(`
        ALTER TABLE disputes 
        ADD COLUMN seller_decision ENUM('accept', 'decline') NULL
      `);
            console.log('✓ Added seller_decision column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  seller_decision already exists');
            } else throw e;
        }

        // Add index
        try {
            await connection.query(`
        ALTER TABLE disputes 
        ADD INDEX idx_seller_disputes (seller_id, status)
      `);
            console.log('✓ Added index on (seller_id, status)');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_seller_disputes already exists');
            } else throw e;
        }

        console.log('\n✅ Migration completed successfully!\n');

        // Verify
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'roundbuy' 
      AND TABLE_NAME = 'disputes' 
      AND COLUMN_NAME IN ('seller_id', 'buyer_demand', 'seller_response', 'seller_decision')
    `);

        console.log('Verified fields:');
        columns.forEach(col => {
            console.log(`  ✓ ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
        });

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

addSellerFields();
