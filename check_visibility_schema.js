const { promisePool } = require('./src/config/database');

async function checkSchema() {
    try {
        console.log('Checking advertisement_plans columns...');
        const [adPlansColumns] = await promisePool.query(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'advertisement_plans'`
        );
        const adPlanCols = adPlansColumns.map(c => c.COLUMN_NAME);
        console.log('advertisement_plans columns:', adPlanCols);

        const requiredAdPlanCols = [
            'plan_type', 'priority_level', 'duration_label',
            'base_price', 'discounted_price', 'distance_boost_km',
            'allows_distance_boost'
        ];

        const missingAdPlanCols = requiredAdPlanCols.filter(c => !adPlanCols.includes(c));
        if (missingAdPlanCols.length > 0) {
            console.log('MISSING columns in advertisement_plans:', missingAdPlanCols);
        } else {
            console.log('advertisement_plans has all required columns.');
        }

        console.log('\nChecking distance_boost_plans table...');
        const [distanceTable] = await promisePool.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'distance_boost_plans'`
        );
        if (distanceTable.length === 0) {
            console.log('MISSING table: distance_boost_plans');
        } else {
            console.log('distance_boost_plans table exists.');
        }

        console.log('\nChecking advertisement_promotions table...');
        const [promoTable] = await promisePool.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'advertisement_promotions'`
        );
        if (promoTable.length === 0) {
            console.log('MISSING table: advertisement_promotions');
        } else {
            console.log('advertisement_promotions table exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
