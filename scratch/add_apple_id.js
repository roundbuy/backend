const { promisePool } = require('../src/config/database');

async function addAppleIdColumn() {
  try {
    console.log('Adding apple_id column to users table...');
    await promisePool.query('ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE AFTER email');
    console.log('✓ Column added successfully');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ apple_id column already exists');
      process.exit(0);
    }
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addAppleIdColumn();
