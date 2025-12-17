// Quick script to verify test user
const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyUser() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        const [result] = await connection.execute(
            'UPDATE users SET is_verified = 1 WHERE email = ?',
            ['testupload@example.com']
        );

        console.log('✅ User verified successfully');
        console.log(`   Rows affected: ${result.affectedRows}`);

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

verifyUser();
