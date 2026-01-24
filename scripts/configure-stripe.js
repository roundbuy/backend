const { promisePool } = require('../src/config/database');

async function configureStripe() {
    try {
        console.log('🔧 Configuring Stripe Keys...\n');

        const publishableKey = '';
        const secretKey = '';

        // Insert or update Stripe keys
        await promisePool.query(`
      INSERT INTO settings (category, setting_key, setting_value, description) VALUES
      ('payment', 'stripe_publishable_key', ?, 'Stripe Publishable Key'),
      ('payment', 'stripe_secret_key', ?, 'Stripe Secret Key')
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [publishableKey, secretKey]);

        console.log('✅ Stripe keys configured successfully!');

        // Verify
        const [settings] = await promisePool.query(
            "SELECT setting_key, LEFT(setting_value, 30) as value_preview FROM settings WHERE setting_key LIKE 'stripe%'"
        );

        console.log('\n📋 Current Stripe Settings:');
        settings.forEach(s => {
            console.log(`   ${s.setting_key}: ${s.value_preview}...`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await promisePool.end();
        process.exit();
    }
}

configureStripe();
