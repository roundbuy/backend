const { promisePool } = require('../../config/database');

async function migrate() {
    try {
        console.log('Starting migration: add_location_limit_to_plans');

        // 1. Add location_limit column if it doesn't exist
        // MySQL 5.7+ supports IF NOT EXISTS for ADD COLUMN but syntax varies, 
        // safe way is to check first or just try-catch the add.
        // Let's check if column exists first.
        const [columns] = await promisePool.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subscription_plans' AND COLUMN_NAME = 'location_limit'",
            [process.env.DB_NAME || 'roundbuy']
        );

        if (columns.length === 0) {
            console.log('Adding location_limit column...');
            await promisePool.query(
                "ALTER TABLE subscription_plans ADD COLUMN location_limit INT DEFAULT 1 AFTER features"
            );
            console.log('Column added.');
        } else {
            console.log('Column location_limit already exists.');
        }

        // 2. Update limits for specific plans
        console.log('Updating plan limits...');

        // Green / Private -> 1 (Default is already 1, but ensuring)
        await promisePool.query(
            "UPDATE subscription_plans SET location_limit = 1 WHERE slug LIKE '%green%' OR slug = 'private' OR plan_type = 'private'"
        );

        // Orange / Business -> 3
        await promisePool.query(
            "UPDATE subscription_plans SET location_limit = 3 WHERE slug LIKE '%orange%'"
        );

        // Gold / Business -> 5
        await promisePool.query(
            "UPDATE subscription_plans SET location_limit = 5 WHERE slug LIKE '%gold%'"
        );

        console.log('Plan limits updated.');

        // Verify
        const [plans] = await promisePool.query("SELECT name, slug, location_limit FROM subscription_plans");
        console.table(plans);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
