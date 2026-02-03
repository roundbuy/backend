import translate from 'translate';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Configure translate engine
translate.engine = 'google';

// Create connection manually to avoid CommonJS/ESM issues if config is CJS
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('--- Auto-Filling Missing Translations ---');

    try {
        // 1. Get Active Languages
        const [languages] = await pool.query('SELECT * FROM languages WHERE is_active = 1 ORDER BY code');
        console.log(`Found ${languages.length} active languages.`);

        // 2. Get All Keys
        const [keys] = await pool.query('SELECT id, key_name, default_text FROM translation_keys');
        console.log(`Found ${keys.length} total translation keys.`);

        // 3. Process Each Language
        for (const lang of languages) {
            console.log(`\nProcessing ${lang.name} (${lang.code})...`);

            // Skip English if it is the source
            if (lang.code === 'en') {
                console.log('Skipping English (Source Language).');
                continue;
            }

            // Get existing translations for this language
            const [existing] = await pool.query(
                'SELECT translation_key_id FROM translations WHERE language_id = ?',
                [lang.id]
            );
            const existingSet = new Set(existing.map(r => r.translation_key_id));

            // Identify missing
            const missingKeys = keys.filter(k => !existingSet.has(k.id));
            console.log(`  > Missing ${missingKeys.length} translations.`);

            if (missingKeys.length === 0) continue;

            // Process in chunks
            const CHUNK_SIZE = 10;
            let success = 0;
            let failed = 0;

            for (let i = 0; i < missingKeys.length; i += CHUNK_SIZE) {
                const chunk = missingKeys.slice(i, i + CHUNK_SIZE);

                await Promise.all(chunk.map(async (keyObj) => {
                    try {
                        const translation = await translate(keyObj.default_text, { to: lang.code, from: 'en' });

                        // Insert
                        await pool.query(
                            'INSERT INTO translations (translation_key_id, language_id, translated_text, is_auto_translated) VALUES (?, ?, ?, 1)',
                            [keyObj.id, lang.id, translation]
                        );
                        success++;
                    } catch (err) {
                        // console.error(`Failed to translate "${keyObj.default_text}": ${err.message}`);
                        // Optionally insert fallback with marker
                        try {
                            const fallback = `[${lang.code.toUpperCase()}] ${keyObj.default_text}`;
                            await pool.query(
                                'INSERT INTO translations (translation_key_id, language_id, translated_text, is_auto_translated) VALUES (?, ?, ?, 1)',
                                [keyObj.id, lang.id, fallback]
                            );
                            failed++; // Count as failed translation, but we handled it
                        } catch (e) { }
                    }
                }));

                process.stdout.write(`\r    Progress: ${Math.min(i + CHUNK_SIZE, missingKeys.length)}/${missingKeys.length}`);
                await delay(200); // Rate limiting
            }
            console.log(`\n  > Done: ${success} translated, ${failed} fallbacks.`);
        }

        console.log('\n--- Complete! ---');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

main();
