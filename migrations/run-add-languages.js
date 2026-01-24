/**
 * Add New Languages Migration
 * Adds 16 new languages to the system
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function addNewLanguages() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database\n');

        // Read and execute migration
        const migrationPath = path.join(__dirname, '2026-01-23-add-new-languages.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('📝 Adding new languages...\n');
        await connection.query(sql);

        // Get all languages
        const [languages] = await connection.query(`
      SELECT code, name, is_active 
      FROM languages 
      ORDER BY name
    `);

        console.log('📊 All Languages in System:');
        console.log('─'.repeat(60));
        languages.forEach((lang, index) => {
            const status = lang.is_active ? '✅' : '❌';
            console.log(`${status} ${(index + 1).toString().padStart(2)}. ${lang.code.padEnd(8)} | ${lang.name}`);
        });

        console.log('\n🎉 Languages added successfully!');
        console.log(`\nTotal languages: ${languages.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addNewLanguages()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
