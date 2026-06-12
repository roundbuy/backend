const { promisePool } = require('../src/config/database');

async function check() {
  try {
    const [ads] = await promisePool.query('SELECT id, title, price, category_id, gender_target, trending_score FROM advertisements LIMIT 20');
    console.log('ADVERTISEMENTS SAMPLE:');
    console.log(JSON.stringify(ads, null, 2));

    const [galleries] = await promisePool.query('SELECT id, name, slug, gallery_type FROM trending_galleries');
    console.log('TRENDING GALLERIES:');
    console.log(JSON.stringify(galleries, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
