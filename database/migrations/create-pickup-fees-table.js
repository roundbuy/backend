/**
 * Database Migration Script: Create Pickup Fees Table
 * Run with: node backend/database/migrations/create-pickup-fees-table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const createPickupFeesTable = async () => {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy_db'
        });

        console.log('✓ Connected to database');

        // Create pickup_fees table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pickup_fees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        fee_type ENUM('pickup_fee', 'safe_service_fee') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'GBP',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Ensure only one active fee per type
        UNIQUE KEY unique_active_fee_type (fee_type, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        await connection.execute(createTableQuery);
        console.log('✓ Created pickup_fees table');

        // Check if table was created
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'pickup_fees'"
        );

        if (tables.length > 0) {
            console.log('✓ Table verification successful');

            // Show table structure
            const [columns] = await connection.execute(
                'DESCRIBE pickup_fees'
            );
            console.log('\n📋 Table Structure:');
            console.table(columns);

            // Seed initial fee data
            console.log('\n💰 Seeding initial fee data...');

            // Check if fees already exist
            const [existingFees] = await connection.execute(
                'SELECT * FROM pickup_fees WHERE is_active = TRUE'
            );

            if (existingFees.length === 0) {
                // Insert pickup fee
                await connection.execute(`
          INSERT INTO pickup_fees (fee_type, amount, currency, description, is_active)
          VALUES ('pickup_fee', 5.00, 'GBP', 'Standard pickup service fee', TRUE)
        `);
                console.log('✓ Added pickup fee: £5.00');

                // Insert safe service fee
                await connection.execute(`
          INSERT INTO pickup_fees (fee_type, amount, currency, description, is_active)
          VALUES ('safe_service_fee', 3.50, 'GBP', 'Safe service and insurance fee', TRUE)
        `);
                console.log('✓ Added safe service fee: £3.50');

                // Show seeded data
                const [fees] = await connection.execute(
                    'SELECT * FROM pickup_fees WHERE is_active = TRUE'
                );
                console.log('\n📊 Seeded Fees:');
                console.table(fees);
            } else {
                console.log('ℹ️  Fees already exist, skipping seed');
                console.table(existingFees);
            }
        } else {
            console.error('✗ Table creation failed');
        }

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
};

// Run migration
createPickupFeesTable()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
