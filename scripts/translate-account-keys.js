/**
 * Manually trigger Google Translate for account translations
 */

const mysql = require('mysql2/promise');
const translate = require('translate');
require('dotenv').config();

// Configure translate to use Google Translate
translate.engine = 'google';
translate.key = process.env.GOOGLE_TRANSLATE_API_KEY;

async function translateAccountKeys() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            port: process.env.DB_PORT || 3306,
        });

        console.log('✅ Connected to database');

        // Get all account-related translation keys
        const [keys] = await connection.query(`
      SELECT id, key_name, default_text 
      FROM translation_keys 
      WHERE category = 'account' OR category = 'common'
    `);

        console.log(`📝 Found ${keys.length} keys to translate`);

        // Get all languages except English
        const [languages] = await connection.query(`
      SELECT id, code, name 
      FROM languages 
      WHERE is_active = TRUE AND code != 'en'
    `);

        console.log(`🌍 Translating to ${languages.length} languages: ${languages.map(l => l.code).join(', ')}\n`);

        let translatedCount = 0;

        for (const key of keys) {
            for (const lang of languages) {
                // Check if translation already exists
                const [existing] = await connection.query(
                    'SELECT id FROM translations WHERE translation_key_id = ? AND language_id = ?',
                    [key.id, lang.id]
                );

                if (existing.length > 0) {
                    console.log(`⏭️  Skipped: ${key.key_name} (${lang.code}) - already exists`);
                    continue;
                }

                try {
                    // Translate using free translate package
                    const translation = await translate(key.default_text, { to: lang.code });

                    // Insert translation
                    await connection.query(
                        `INSERT INTO translations (translation_key_id, language_id, translated_text, is_auto_translated)
             VALUES (?, ?, ?, TRUE)`,
                        [key.id, lang.id, translation]
                    );

                    console.log(`✅ ${key.key_name} (${lang.code}): "${key.default_text}" → "${translation}"`);
                    translatedCount++;

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));

                } catch (error) {
                    console.error(`❌ Error translating ${key.key_name} to ${lang.code}:`, error.message);
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Translated: ${translatedCount} entries`);
        console.log(`   📝 Keys: ${keys.length}`);
        console.log(`   🌍 Languages: ${languages.length}`);
        console.log(`\n🎉 Translation complete!`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

translateAccountKeys()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });
