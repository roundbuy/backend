/**
 * Migration: Add requires_size field to categories table
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database');

        // Check if column already exists
        const [columns] = await connection.query(`
      SHOW COLUMNS FROM categories LIKE 'requires_size'
    `);

        if (columns.length > 0) {
            console.log('⏭️  Column requires_size already exists, skipping migration');
            return;
        }

        console.log('📝 Adding requires_size column to categories table...');

        // Add the column
        await connection.query(`
      ALTER TABLE categories 
      ADD COLUMN requires_size ENUM('required', 'optional', 'not_applicable') 
      DEFAULT 'not_applicable' 
      AFTER description
    `);

        console.log('✅ Column added successfully');

        // Update Fashion & Clothing categories
        console.log('📝 Setting Fashion & Clothing categories to required...');
        const [fashionResult] = await connection.query(`
      UPDATE categories 
      SET requires_size = 'required' 
      WHERE name IN ('Fashion', 'Clothing', 'Apparel', 'Clothes', 'Womens Fashion', 'Mens Fashion', 'Kids Fashion')
    `);
        console.log(`✅ Updated ${fashionResult.affectedRows} fashion/clothing categories`);

        // Update Sports-related categories
        console.log('📝 Setting Sports categories to optional...');
        const [sportsResult] = await connection.query(`
      UPDATE categories 
      SET requires_size = 'optional' 
      WHERE name IN ('Hunting', 'Horse Riding', 'Sports', 'Equestrian', 'Outdoor Sports', 'Fitness', 'Athletics')
    `);
        console.log(`✅ Updated ${sportsResult.affectedRows} sports categories`);

        // Show summary
        const [summary] = await connection.query(`
      SELECT requires_size, COUNT(*) as count 
      FROM categories 
      GROUP BY requires_size
    `);

        console.log('\n📊 Summary:');
        summary.forEach(row => {
            console.log(`   ${row.requires_size}: ${row.count} categories`);
        });

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
