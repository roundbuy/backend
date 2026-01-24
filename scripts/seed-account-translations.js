/**
 * Seed Account-Related Translation Keys
 * Run this script to add User Account screen translation keys to the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const translations = {
    // Account screen
    'account.title': 'User account',
    'account.tab_account': 'User account',
    'account.tab_settings': 'User settings',

    // Account menu items
    'account.personal_info': 'Personal information',
    'account.privacy': 'Privacy & Account',
    'account.login_security': 'Login & security',
    'account.billing': 'Billing & payments',
    'account.support': 'Customer support',
    'account.country_settings': 'Country settings',
    'account.measurement': 'Measurement Unit',
    'account.report_content': 'Report content',
    'account.legal_info': 'Legal info',

    // Settings menu items
    'account.manage_offers': 'Manage offers',
    'account.pickups': 'Pick Ups & Exchanges',
    'account.support_resolution': 'Support & Resolution',
    'account.purchase_visibility': 'Purchase Visibility',
    'account.locations': 'Default location & Product locations',
    'account.membership': 'Membership',
    'account.feedbacks': 'Feedbacks',
    'account.rewards': 'Rewards',
    'account.review': 'Review',
    'account.share': 'Share',

    // Footer
    'account.member_id': 'Member ID',
    'account.app_name': 'RoundBuy App',

    // Alerts
    'account.logout_confirm': 'Are you sure you want to logout?',
    'account.logout_failed': 'Failed to logout. Please try again.',

    // Common
    'common.error': 'Error',
};

async function seedAccountTranslations() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database');

        let addedCount = 0;
        let skippedCount = 0;

        for (const [keyName, defaultText] of Object.entries(translations)) {
            // Check if key already exists
            const [existing] = await connection.query(
                'SELECT id FROM translation_keys WHERE key_name = ?',
                [keyName]
            );

            if (existing.length > 0) {
                console.log(`⏭️  Skipped: ${keyName} (already exists)`);
                skippedCount++;
                continue;
            }

            // Determine category from key name
            const category = keyName.split('.')[0];

            // Insert translation key
            const [result] = await connection.query(
                `INSERT INTO translation_keys (key_name, category, default_text, description)
         VALUES (?, ?, ?, ?)`,
                [keyName, category, defaultText, `Translation for ${keyName}`]
            );

            const translationKeyId = result.insertId;

            // Get all active languages
            const [languages] = await connection.query(
                'SELECT id, code FROM languages WHERE is_active = TRUE'
            );

            // Insert English translation
            const englishLang = languages.find(l => l.code === 'en');
            if (englishLang) {
                await connection.query(
                    `INSERT INTO translations (translation_key_id, language_id, translated_text, is_auto_translated)
           VALUES (?, ?, ?, FALSE)`,
                    [translationKeyId, englishLang.id, defaultText]
                );
            }

            console.log(`✅ Added: ${keyName} = "${defaultText}"`);
            addedCount++;
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Added: ${addedCount} translation keys`);
        console.log(`   ⏭️  Skipped: ${skippedCount} (already existed)`);
        console.log(`   📝 Total: ${Object.keys(translations).length} keys processed`);
        console.log('\n🎉 Account translations seeded successfully!');
        console.log('💡 Other languages will be auto-translated via Google Translate when requested.');

    } catch (error) {
        console.error('❌ Error seeding translations:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the seeding function
seedAccountTranslations()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
