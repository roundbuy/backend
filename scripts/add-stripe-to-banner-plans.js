const { promisePool } = require('../src/config/database');

async function addStripeFieldsToBannerPlans() {
    try {
        console.log('🔄 Adding Stripe fields to banner_plans...\n');

        // Check if columns already exist
        const [columns] = await promisePool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banner_plans' 
      AND COLUMN_NAME IN ('stripe_product_id', 'stripe_price_id')
    `);

        if (columns.length === 2) {
            console.log('✅ Stripe fields already exist!');
            return;
        }

        // Add stripe_product_id if not exists
        if (!columns.find(c => c.COLUMN_NAME === 'stripe_product_id')) {
            await promisePool.query(`
        ALTER TABLE banner_plans 
        ADD COLUMN stripe_product_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Product ID' AFTER max_clicks
      `);
            console.log('✅ Added stripe_product_id column');
        }

        // Add stripe_price_id if not exists
        if (!columns.find(c => c.COLUMN_NAME === 'stripe_price_id')) {
            await promisePool.query(`
        ALTER TABLE banner_plans 
        ADD COLUMN stripe_price_id VARCHAR(255) DEFAULT NULL COMMENT 'Stripe Price ID for default currency' AFTER stripe_product_id
      `);
            console.log('✅ Added stripe_price_id column');
        }

        // Add index
        const [indexes] = await promisePool.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banner_plans' 
      AND INDEX_NAME = 'idx_stripe_product_id'
    `);

        if (indexes.length === 0) {
            await promisePool.query(`
        ALTER TABLE banner_plans 
        ADD INDEX idx_stripe_product_id (stripe_product_id)
      `);
            console.log('✅ Added index on stripe_product_id');
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await promisePool.end();
        process.exit();
    }
}

addStripeFieldsToBannerPlans();
