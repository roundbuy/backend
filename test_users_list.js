const { promisePool: db } = require('./src/config/database');
async function run() {
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.user_type, u.cumulative_earnings, u.subscription_plan_id, sp.slug as plan_slug
     FROM users u
     LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
     ORDER BY u.id DESC LIMIT 5`
  );
  console.log('LAST 5 USERS:', rows);
  process.exit(0);
}
run().catch(console.error);
