const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllColumns() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        console.log('✓ Connected to database\n');

        // Get ALL columns
        const [columns] = await connection.query('SHOW FULL COLUMNS FROM disputes');

        console.log('ALL disputes table columns:');
        console.log('='.repeat(100));
        console.log('Field'.padEnd(30), 'Type'.padEnd(40), 'Null', 'Key', 'Default');
        console.log('='.repeat(100));

        columns.forEach(col => {
            console.log(
                col.Field.padEnd(30),
                col.Type.padEnd(40),
                col.Null.padEnd(5),
                (col.Key || '').padEnd(5),
                col.Default || ''
            );
        });

        console.log('\n' + '='.repeat(100));
        console.log(`Total columns: ${columns.length}`);

        // Check for seller fields
        const sellerFields = columns.filter(c =>
            c.Field.includes('seller') || c.Field.includes('buyer_demand')
        );

        if (sellerFields.length > 0) {
            console.log('\n✓ Seller-related fields found:');
            sellerFields.forEach(f => console.log(`  - ${f.Field} (${f.Type})`));
        } else {
            console.log('\n✗ No seller-related fields found!');
            console.log('Need to add: seller_id, seller_response, seller_decision, buyer_demand');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAllColumns();
