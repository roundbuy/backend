const { promisePool } = require('./src/config/database');

async function checkAds() {
  try {
    console.log('--- USER LOCATIONS ---');
    const [locations] = await promisePool.execute("SELECT id, name, city, latitude, longitude FROM user_locations LIMIT 10");
    console.log(locations);

    console.log('\n--- ADVERTISEMENTS ---');
    const [ads] = await promisePool.execute("SELECT id, title, status, location_id FROM advertisements LIMIT 10");
    console.log(ads);

    console.log('\n--- ADVERTISEMENTS LOCATIONS MAPPING ---');
    const [mappings] = await promisePool.execute("SELECT * FROM advertisement_locations");
    console.log(mappings);

  } catch (err) {
    console.error('Error running diagnostics:', err);
  } finally {
    process.exit(0);
  }
}

checkAds();
