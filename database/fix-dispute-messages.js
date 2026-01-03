const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDisputeMessages() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('✓ Connected to database\n');

        // Check current table structure
        const [columns] = await connection.query('DESCRIBE dispute_messages');

        console.log('Current dispute_messages table structure:');
        console.log('='.repeat(80));
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(40)}`);
        });
        console.log('='.repeat(80));

        // Check for missing columns
        const hasSystemMessage = columns.some(col => col.Field === 'is_system_message');
        const hasMessageType = columns.some(col => col.Field === 'message_type');

        // Add is_system_message if missing
        if (!hasSystemMessage) {
            console.log('\n❌ is_system_message column is missing!');
            console.log('Adding is_system_message column...');

            await connection.query(`
        ALTER TABLE dispute_messages 
        ADD COLUMN is_system_message BOOLEAN DEFAULT FALSE
        AFTER is_admin_message
      `);

            console.log('✅ is_system_message column added!');
        } else {
            console.log('\n✅ is_system_message column exists');
        }

        // Add message_type if missing
        if (!hasMessageType) {
            console.log('\n❌ message_type column is missing!');
            console.log('Adding message_type column...');

            await connection.query(`
        ALTER TABLE dispute_messages 
        ADD COLUMN message_type ENUM('text', 'status_update', 'resolution_offer', 'counteroffer') DEFAULT 'text'
        AFTER is_system_message
      `);

            console.log('✅ message_type column added!');
        } else {
            console.log('\n✅ message_type column exists');
        }

        console.log('\n✅ All columns are now present!');

        // Show final structure
        const [finalColumns] = await connection.query('DESCRIBE dispute_messages');
        console.log('\nFinal dispute_messages table structure:');
        console.log('='.repeat(80));
        finalColumns.forEach(col => {
            console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(40)}`);
        });
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

fixDisputeMessages();
