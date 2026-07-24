const { promisePool: db } = require('./src/config/database');
async function run() {
  const [plans] = await db.query('SELECT * FROM subscription_plans');
  console.log('PLANS:', plans);
  
  // Let's also check the schema of users table
  const [columns] = await db.query('DESCRIBE users');
  console.log('USERS COLUMNS:', columns.map(c => ({ name: c.Field, type: c.Type, default: c.Default })));
  
  process.exit(0);
}
run().catch(console.error);
