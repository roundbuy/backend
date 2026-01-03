const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function createClaimsTables() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        console.log('✓ Connected to database\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'schema', 'claims.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('Creating claims tables...\n');

        // Execute SQL
        await connection.query(sql);

        console.log('✅ Claims tables created successfully!\n');

        // Verify tables
        const [tables] = await connection.query(`
      SHOW TABLES LIKE 'claim%'
    `);

        console.log('Created tables:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  ✓ ${tableName}`);
        });

        // Show claims table structure
        console.log('\nClaims table structure:');
        console.log('='.repeat(80));
        const [columns] = await connection.query('DESCRIBE claims');
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(30)} ${col.Type.padEnd(40)}`);
        });
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('\n⚠️  Tables already exist. This is OK.');
        } else {
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

createClaimsTables();
