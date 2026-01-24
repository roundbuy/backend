/**
 * Database Migration Script: Create Pickup Schedules Table
 * Run with: node backend/database/migrations/create-pickup-schedules-table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const createPickupSchedulesTable = async () => {
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

        // Create pickup_schedules table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pickup_schedules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        offer_id INT NOT NULL,
        advertisement_id INT NOT NULL,
        buyer_id INT NOT NULL,
        seller_id INT NOT NULL,
        
        -- Schedule details
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        description TEXT,
        
        -- Status tracking
        status ENUM('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled') DEFAULT 'pending',
        
        -- Payment tracking
        pickup_fee DECIMAL(10,2) DEFAULT 0.00,
        safe_service_fee DECIMAL(10,2) DEFAULT 0.00,
        total_fee DECIMAL(10,2) DEFAULT 0.00,
        payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
        payment_id INT,
        paid_at TIMESTAMP NULL,
        
        -- Reschedule tracking
        original_schedule_id INT,
        reschedule_count INT DEFAULT 0,
        reschedule_reason TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        
        -- Foreign keys
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
        FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (original_schedule_id) REFERENCES pickup_schedules(id) ON DELETE SET NULL,
        
        -- Indexes
        INDEX idx_buyer_id (buyer_id),
        INDEX idx_seller_id (seller_id),
        INDEX idx_offer_id (offer_id),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_scheduled_date (scheduled_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        await connection.execute(createTableQuery);
        console.log('✓ Created pickup_schedules table');

        // Check if table was created
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'pickup_schedules'"
        );

        if (tables.length > 0) {
            console.log('✓ Table verification successful');

            // Show table structure
            const [columns] = await connection.execute(
                'DESCRIBE pickup_schedules'
            );
            console.log('\n📋 Table Structure:');
            console.table(columns);
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
createPickupSchedulesTable()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
