/**
 * Fix requires_size values for all categories
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRequiresSize() {
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

        // First, set all categories to 'not_applicable' by default
        console.log('📝 Setting all categories to not_applicable...');
        await connection.query(`
      UPDATE categories 
      SET requires_size = 'not_applicable' 
      WHERE requires_size IS NULL OR requires_size = ''
    `);

        // Set Fashion & Clothing categories to 'required'
        console.log('📝 Setting Fashion & Clothing to required...');
        const [fashionResult] = await connection.query(`
      UPDATE categories 
      SET requires_size = 'required' 
      WHERE name LIKE '%Fashion%' 
         OR name LIKE '%Clothing%' 
         OR name LIKE '%Apparel%'
         OR name LIKE '%Clothes%'
    `);
        console.log(`✅ Updated ${fashionResult.affectedRows} fashion categories`);

        // Set Sports-related categories to 'optional'
        console.log('📝 Setting Sports categories to optional...');
        const [sportsResult] = await connection.query(`
      UPDATE categories 
      SET requires_size = 'optional' 
      WHERE name LIKE '%Sport%' 
         OR name LIKE '%Hunting%' 
         OR name LIKE '%Horse%'
         OR name LIKE '%Equestrian%'
         OR name LIKE '%Fitness%'
         OR name LIKE '%Athletic%'
    `);
        console.log(`✅ Updated ${sportsResult.affectedRows} sports categories`);

        // Show current state
        const [categories] = await connection.query(`
      SELECT id, name, requires_size 
      FROM categories 
      ORDER BY id
    `);

        console.log('\n📊 Current Categories:');
        console.log('─'.repeat(80));
        categories.forEach(cat => {
            const emoji = cat.requires_size === 'required' ? '⭐' :
                cat.requires_size === 'optional' ? '🔵' : '⚪';
            console.log(`${emoji} ${cat.id}. ${cat.name.padEnd(30)} → ${cat.requires_size}`);
        });

        // Summary
        const [summary] = await connection.query(`
      SELECT requires_size, COUNT(*) as count 
      FROM categories 
      GROUP BY requires_size
    `);

        console.log('\n📊 Summary:');
        summary.forEach(row => {
            console.log(`   ${row.requires_size}: ${row.count} categories`);
        });

        console.log('\n🎉 Update completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

fixRequiresSize()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
