const { promisePool } = require('../src/config/database');

async function checkColumns() {
  try {
    const [rows] = await promisePool.query('DESCRIBE users');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkColumns();
