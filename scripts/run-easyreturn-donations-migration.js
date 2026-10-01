const { promisePool } = require('../src/config/database');

async function runMigration() {
    console.log('🚀 Running EasyReturn and Donation DB migration...');
    const queries = [
        // 1. Advertisements
        `ALTER TABLE advertisements ADD COLUMN donation_percent DECIMAL(5,2) DEFAULT 0.00`,
        `ALTER TABLE advertisements ADD COLUMN is_charity_listing TINYINT(1) DEFAULT 0`,
        
        // 2. Users
        `ALTER TABLE users ADD COLUMN is_donator TINYINT(1) DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN show_donator_status TINYINT(1) DEFAULT 1`,

        // 3. Offers
        `ALTER TABLE offers ADD COLUMN easy_return_agreed TINYINT(1) DEFAULT 0`,
        `ALTER TABLE offers ADD COLUMN easy_return_split_percent INT DEFAULT 50`,

        // 4. Orders
        `ALTER TABLE orders ADD COLUMN easy_return_enabled TINYINT(1) DEFAULT 0`,
        `ALTER TABLE orders ADD COLUMN donation_percent DECIMAL(5,2) DEFAULT 0.00`,
        `ALTER TABLE orders ADD COLUMN donation_amount DECIMAL(10,2) DEFAULT 0.00`,

        // 5. Charity donations table
        `CREATE TABLE IF NOT EXISTS charity_donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NULL,
            advertisement_id INT NULL,
            seller_id INT NOT NULL,
            buyer_id INT NULL,
            total_item_price DECIMAL(10,2) NOT NULL,
            donation_percent DECIMAL(5,2) NOT NULL,
            donation_amount DECIMAL(10,2) NOT NULL,
            platform_fee DECIMAL(10,2) DEFAULT 0.00,
            status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_seller (seller_id),
            INDEX idx_order (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const sql of queries) {
        try {
            await promisePool.query(sql);
            console.log(`✅ Success: ${sql.substring(0, 45)}...`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
                console.log(`ℹ️ Column already exists: ${sql.substring(0, 45)}...`);
            } else {
                console.warn(`⚠️ Warning running query: ${sql.substring(0, 45)}... -> ${err.message}`);
            }
        }
    }

    console.log('🎉 EasyReturn and Donations migration complete!');
    process.exit(0);
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
