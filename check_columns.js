require('dotenv').config();
const { promisePool } = require('./src/config/database');

async function run() {
  try {
    console.log('\n--- DESCRIBE user_social_club_extensions ---');
    const [cols] = await promisePool.query('DESCRIBE user_social_club_extensions');
    console.table(cols);

    console.log('\n--- DESCRIBE user_extension_purchases ---');
    const [cols2] = await promisePool.query('DESCRIBE user_extension_purchases');
    console.table(cols2);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
