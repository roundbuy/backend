/**
 * Database Migration Script: Add Pickup Fees Enhancements
 * - Add buyer_fee and item_fee_percentage to pickup_fees
 * - Add payment_method and offer_price to pickup_schedules
 * - Add discount tracking
 * Run with: node backend/database/migrations/add-pickup-fees-enhancements.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const addPickupFeesEnhancements = async () => {
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

        // Step 1: Update pickup_fees table to support new fee types
        console.log('\n📋 Step 1: Updating pickup_fees table...');

        // First, drop the unique constraint if it exists
        try {
            await connection.execute(`
                ALTER TABLE pickup_fees 
                DROP INDEX unique_active_fee_type
            `);
            console.log('✓ Removed old unique constraint');
        } catch (error) {
            console.log('ℹ️  Unique constraint already removed or does not exist');
        }

        // Modify the fee_type enum to include new types
        await connection.execute(`
            ALTER TABLE pickup_fees 
            MODIFY COLUMN fee_type ENUM('pickup_fee', 'safe_service_fee', 'buyer_fee', 'item_fee_percentage') NOT NULL
        `);
        console.log('✓ Updated fee_type enum with new types');

        // Add is_percentage column
        await connection.execute(`
            ALTER TABLE pickup_fees 
            ADD COLUMN IF NOT EXISTS is_percentage BOOLEAN DEFAULT FALSE AFTER amount
        `);
        console.log('✓ Added is_percentage column');

        // Step 2: Update pickup_schedules table
        console.log('\n📋 Step 2: Updating pickup_schedules table...');

        // Add payment_method column
        await connection.execute(`
            ALTER TABLE pickup_schedules 
            ADD COLUMN IF NOT EXISTS payment_method ENUM('card', 'wallet') DEFAULT 'card' AFTER payment_status
        `);
        console.log('✓ Added payment_method column');

        // Add offer_price column
        await connection.execute(`
            ALTER TABLE pickup_schedules 
            ADD COLUMN IF NOT EXISTS offer_price DECIMAL(10,2) DEFAULT 0.00 AFTER total_fee
        `);
        console.log('✓ Added offer_price column');

        // Add buyer_fee column
        await connection.execute(`
            ALTER TABLE pickup_schedules 
            ADD COLUMN IF NOT EXISTS buyer_fee DECIMAL(10,2) DEFAULT 0.00 AFTER safe_service_fee
        `);
        console.log('✓ Added buyer_fee column');

        // Add item_fee column
        await connection.execute(`
            ALTER TABLE pickup_schedules 
            ADD COLUMN IF NOT EXISTS item_fee DECIMAL(10,2) DEFAULT 0.00 AFTER buyer_fee
        `);
        console.log('✓ Added item_fee column');

        // Add item_fee_discount column
        await connection.execute(`
            ALTER TABLE pickup_schedules 
            ADD COLUMN IF NOT EXISTS item_fee_discount DECIMAL(10,2) DEFAULT 0.00 AFTER item_fee
        `);
        console.log('✓ Added item_fee_discount column');

        // Step 3: Seed new fee types
        console.log('\n📋 Step 3: Seeding new fee types...');

        // Check if buyer_fee exists
        const [buyerFees] = await connection.execute(
            "SELECT * FROM pickup_fees WHERE fee_type = 'buyer_fee' AND is_active = TRUE"
        );

        if (buyerFees.length === 0) {
            await connection.execute(`
                INSERT INTO pickup_fees (fee_type, amount, is_percentage, currency, description, is_active)
                VALUES ('buyer_fee', 2.00, FALSE, 'GBP', 'Fixed buyer service fee', TRUE)
            `);
            console.log('✓ Added buyer_fee: £2.00 (fixed)');
        } else {
            console.log('ℹ️  buyer_fee already exists');
        }

        // Check if item_fee_percentage exists
        const [itemFees] = await connection.execute(
            "SELECT * FROM pickup_fees WHERE fee_type = 'item_fee_percentage' AND is_active = TRUE"
        );

        if (itemFees.length === 0) {
            await connection.execute(`
                INSERT INTO pickup_fees (fee_type, amount, is_percentage, currency, description, is_active)
                VALUES ('item_fee_percentage', 5.00, TRUE, 'GBP', 'Item fee as percentage of offer price', TRUE)
            `);
            console.log('✓ Added item_fee_percentage: 5% of offer price');
        } else {
            console.log('ℹ️  item_fee_percentage already exists');
        }

        // Step 4: Show updated table structures
        console.log('\n📊 Updated Table Structures:');

        console.log('\n--- pickup_fees table ---');
        const [feeColumns] = await connection.execute('DESCRIBE pickup_fees');
        console.table(feeColumns);

        console.log('\n--- pickup_schedules table (relevant columns) ---');
        const [scheduleColumns] = await connection.execute(
            "DESCRIBE pickup_schedules"
        );
        const relevantColumns = scheduleColumns.filter(col =>
            ['payment_method', 'offer_price', 'buyer_fee', 'item_fee', 'item_fee_discount', 'pickup_fee', 'safe_service_fee', 'total_fee'].includes(col.Field)
        );
        console.table(relevantColumns);

        // Show all active fees
        console.log('\n💰 All Active Fees:');
        const [allFees] = await connection.execute(
            'SELECT * FROM pickup_fees WHERE is_active = TRUE ORDER BY id'
        );
        console.table(allFees);

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
addPickupFeesEnhancements()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
