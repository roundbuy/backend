const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function run() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roundbuy',
    });

    console.log('Database connected successfully.');

    // 1. Add regional columns to ad_sizes
    console.log('Checking ad_sizes columns...');
    const [adSizesCols] = await connection.query("SHOW COLUMNS FROM ad_sizes");
    const colNames = adSizesCols.map(c => c.Field);

    const alters = [];
    if (!colNames.includes('fr_size')) alters.push('ADD COLUMN fr_size VARCHAR(50) DEFAULT NULL AFTER intl_size');
    if (!colNames.includes('it_size')) alters.push('ADD COLUMN it_size VARCHAR(50) DEFAULT NULL AFTER fr_size');
    if (!colNames.includes('jp_size')) alters.push('ADD COLUMN jp_size VARCHAR(50) DEFAULT NULL AFTER it_size');
    if (!colNames.includes('size_category')) {
      alters.push("ADD COLUMN size_category ENUM('clothing', 'shoes', 'belts', 'jeans', 'kids_clothing') DEFAULT 'clothing' AFTER jp_size");
    }

    if (alters.length > 0) {
      console.log(`Altering ad_sizes table: ${alters.join(', ')}`);
      await connection.query(`ALTER TABLE ad_sizes ${alters.join(', ')}`);
      console.log('ad_sizes table altered successfully.');
    } else {
      console.log('Regional size columns already exist in ad_sizes.');
    }

    // 2. Add columns to users table
    console.log('Checking users columns...');
    const [usersCols] = await connection.query("SHOW COLUMNS FROM users");
    const userColNames = usersCols.map(c => c.Field);

    const userAlters = [];
    if (!userColNames.includes('country_auto_detected')) {
      userAlters.push('ADD COLUMN country_auto_detected TINYINT(1) DEFAULT 1');
    }
    if (!userColNames.includes('last_country_detection_at')) {
      userAlters.push('ADD COLUMN last_country_detection_at TIMESTAMP NULL DEFAULT NULL');
    }

    if (userAlters.length > 0) {
      console.log(`Altering users table: ${userAlters.join(', ')}`);
      await connection.query(`ALTER TABLE users ${userAlters.join(', ')}`);
      console.log('users table altered successfully.');
    } else {
      console.log('Detection columns already exist in users.');
    }

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

run();
