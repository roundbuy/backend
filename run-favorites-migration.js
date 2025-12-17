// Run favorites table migration
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Check if favorites table exists
        const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites'
    `, [process.env.DB_NAME || 'roundbuy']);

        if (tables.length > 0) {
            console.log('ℹ️  Favorites table already exists');

            // Show table structure
            const [columns] = await connection.execute('DESCRIBE favorites');
            console.log('\n📋 Table structure:');
            columns.forEach(col => {
                console.log(`   ${col.Field} (${col.Type})`);
            });

            // Show count
            const [count] = await connection.execute('SELECT COUNT(*) as total FROM favorites');
            console.log(`\n📊 Total favorites: ${count[0].total}`);
        } else {
            console.log('📝 Creating favorites table...');

            // Read SQL file
            const sqlFile = path.join(__dirname, 'database', 'add_favorites_table.sql');
            const sql = fs.readFileSync(sqlFile, 'utf8');

            // Execute SQL
            await connection.query(sql);

            console.log('✅ Favorites table created successfully');
        }

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

runMigration();
