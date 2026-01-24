const { promisePool } = require('../src/config/database');
require('dotenv').config();

async function addColumnsToOffers() {
    try {
        console.log('Adding advertisement_id and buyer_id to offers table...\n');

        // Check if columns already exist
        const [columns] = await promisePool.query("DESCRIBE offers");
        const columnNames = columns.map(col => col.Field);

        const hasAdvertisementId = columnNames.includes('advertisement_id');
        const hasBuyerId = columnNames.includes('buyer_id');
        const hasSellerId = columnNames.includes('seller_id');

        if (hasAdvertisementId && hasBuyerId && hasSellerId) {
            console.log('✓ All columns already exist!');
            console.log('  - advertisement_id: EXISTS');
            console.log('  - buyer_id: EXISTS');
            console.log('  - seller_id: EXISTS');
            process.exit(0);
        }

        // Add advertisement_id column
        if (!hasAdvertisementId) {
            console.log('Adding advertisement_id column...');
            await promisePool.query(`
        ALTER TABLE offers 
        ADD COLUMN advertisement_id INT NOT NULL AFTER conversation_id
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD INDEX idx_advertisement_id (advertisement_id)
      `);

            console.log('✓ Added advertisement_id column with foreign key and index');
        } else {
            console.log('⚠ advertisement_id already exists, skipping');
        }

        // Add buyer_id column
        if (!hasBuyerId) {
            console.log('\nAdding buyer_id column...');
            await promisePool.query(`
        ALTER TABLE offers 
        ADD COLUMN buyer_id INT NOT NULL AFTER advertisement_id
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD INDEX idx_buyer_id (buyer_id)
      `);

            console.log('✓ Added buyer_id column with foreign key and index');
        } else {
            console.log('⚠ buyer_id already exists, skipping');
        }

        // Add seller_id column
        if (!hasSellerId) {
            console.log('\nAdding seller_id column...');
            await promisePool.query(`
        ALTER TABLE offers 
        ADD COLUMN seller_id INT NOT NULL AFTER buyer_id
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      `);

            await promisePool.query(`
        ALTER TABLE offers 
        ADD INDEX idx_seller_id (seller_id)
      `);

            console.log('✓ Added seller_id column with foreign key and index');
        } else {
            console.log('⚠ seller_id already exists, skipping');
        }

        // Show updated structure
        console.log('\n--- Updated offers table structure ---');
        const [updatedCols] = await promisePool.query("DESCRIBE offers");
        updatedCols.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key}`);
        });

        console.log('\n✓ Migration completed successfully!');
        console.log('\nNow you can query offers by:');
        console.log('  - advertisement_id (to get all offers for a product)');
        console.log('  - buyer_id (to get all offers made by a buyer)');
        console.log('  - seller_id (to get all offers received by a seller)');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

addColumnsToOffers();
