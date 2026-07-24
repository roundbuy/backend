require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function runMigration() {
    try {
        console.log('🚀 Starting Extensions database tables migration...\n');

        console.log('Drop existing tables if they exist...');
        await promisePool.query('DROP TABLE IF EXISTS user_social_club_extensions');
        await promisePool.query('DROP TABLE IF EXISTS user_extension_purchases');

        console.log('📝 Creating user_social_club_extensions table...');
        await promisePool.query(`
            CREATE TABLE user_social_club_extensions (
              id INT PRIMARY KEY AUTO_INCREMENT,
              user_id INT NOT NULL,
              extension_type VARCHAR(50) NOT NULL COMMENT 'social_clubs, events, garage_sales, service_listings',
              expires_at TIMESTAMP NOT NULL,
              amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              stripe_pi_id VARCHAR(255) DEFAULT NULL,
              is_gift TINYINT DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY user_ext_unique (user_id, extension_type),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Created user_social_club_extensions table successfully');

        console.log('📝 Creating user_extension_purchases table...');
        await promisePool.query(`
            CREATE TABLE user_extension_purchases (
              id INT PRIMARY KEY AUTO_INCREMENT,
              user_id INT NOT NULL,
              extension_type VARCHAR(50) NOT NULL,
              plan_name VARCHAR(100) DEFAULT NULL,
              amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              currency VARCHAR(3) DEFAULT 'GBP',
              ad_id INT DEFAULT NULL,
              payment_intent_id VARCHAR(255) DEFAULT NULL,
              payment_method_id VARCHAR(255) DEFAULT NULL,
              save_card TINYINT DEFAULT 0,
              status VARCHAR(50) DEFAULT 'completed',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Created user_extension_purchases table successfully');

        console.log('\n📋 Verifying database tables...');
        const [tables] = await promisePool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name IN ('user_social_club_extensions', 'user_extension_purchases')
        `);

        console.log(`Found ${tables.length}/2 tables:`);
        tables.forEach(table => console.log(`   - ${table.table_name}`));

        console.log('\n✨ Extensions migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
