const { promisePool } = require('../src/config/database');

async function migrate() {
    try {
        console.log('Starting migration: Add 20km and 30km distance plans...');

        // 1. Update Unlimited to sort_order 6
        await promisePool.query(
            "UPDATE distance_boost_plans SET sort_order = 6 WHERE slug = 'distance-boost-unlimited'"
        );
        console.log('✓ Updated Unlimited sort_order to 6');

        // 2. Insert 20km plan (check if exists first)
        const [existing20] = await promisePool.query("SELECT id FROM distance_boost_plans WHERE slug = 'distance-boost-20km'");
        if (existing20.length === 0) {
            await promisePool.query(`
        INSERT INTO distance_boost_plans 
        (name, slug, description, distance_km, is_unlimited, base_price, discounted_price, currency_code, is_active, sort_order) 
        VALUES 
        ('Distance Boost - 20 km', 'distance-boost-20km', 
         'Extend your ad visibility to 20 km radius from your location', 
         20, FALSE, 3.30, 1.65, 'GBP', TRUE, 4)
      `);
            console.log('✓ Inserted 20km plan');
        } else {
            console.log('ℹ 20km plan already exists');
        }

        // 3. Insert 30km plan
        const [existing30] = await promisePool.query("SELECT id FROM distance_boost_plans WHERE slug = 'distance-boost-30km'");
        if (existing30.length === 0) {
            await promisePool.query(`
        INSERT INTO distance_boost_plans 
        (name, slug, description, distance_km, is_unlimited, base_price, discounted_price, currency_code, is_active, sort_order) 
        VALUES 
        ('Distance Boost - 30 km', 'distance-boost-30km', 
         'Extend your ad visibility to 30 km radius from your location', 
         30, FALSE, 3.60, 1.80, 'GBP', TRUE, 5)
      `);
            console.log('✓ Inserted 30km plan');
        } else {
            console.log('ℹ 30km plan already exists');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
