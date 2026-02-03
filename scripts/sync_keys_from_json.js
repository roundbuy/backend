const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

const KEYS_FILE = '/Users/ravisvyas/Code/roundbuy-new/mobile-app/extracted_keys.json';

async function main() {
    try {
        console.log('--- Syncing Keys from JSON to Database ---');

        // 1. Read JSON file
        if (!fs.existsSync(KEYS_FILE)) {
            console.error('Keys file not found!');
            process.exit(1);
        }
        const fileContent = fs.readFileSync(KEYS_FILE, 'utf8');
        const jsonKeys = JSON.parse(fileContent);

        // 2. Get DB Keys
        const [dbRows] = await promisePool.query('SELECT key_name FROM translation_keys');
        const dbKeySet = new Set(dbRows.map(k => k.key_name));

        // 3. Identify Missing
        const missingKeys = [];
        for (const [key, text] of Object.entries(jsonKeys)) {
            if (!dbKeySet.has(key)) {
                missingKeys.push({ key, text });
            }
        }

        console.log(`Identified ${missingKeys.length} new keys to insert.`);

        // 4. Insert Missing
        if (missingKeys.length > 0) {
            console.log('Inserting keys...');
            let inserted = 0;

            for (const { key, text } of missingKeys) {
                let category = 'common';

                // Intelligent category detection
                if (key.includes('.') && key.length < 255) {
                    const parts = key.split('.');
                    // Only use first part as category if it's a reasonable identifier (acc.login)
                    // Not if it's a sentence like "This is a sentence."
                    if (parts[0].length < 50 && !parts[0].includes(' ')) {
                        category = parts[0];
                    }
                }

                const safeText = text || key;

                // Truncate if necessary (though text columns are usually TEXT or LONGTEXT)
                // But key_name is usually VARCHAR(255). 
                // If key is very long, it might fail if DB has 255 limit on key_name. 
                // Let's check schema assumption. Assuming key_name is VARCHAR(255).
                // Many keys in extracted_keys.json seem to be full sentences.

                // If key is a sentence, we still insert it as key_name? 
                // In the provided JSON, keys ARE the sentences.
                // If the database has a limit on key_name, we might need to skip or hash them.
                // However, typically content-based keys use the full string.

                try {
                    await promisePool.query(
                        'INSERT INTO translation_keys (key_name, category, default_text) VALUES (?, ?, ?)',
                        [key, category, safeText]
                    );
                    inserted++;
                } catch (err) {
                    if (err.code === 'ER_DATA_TOO_LONG') {
                        console.warn(`Skipping key too long: ${key.substring(0, 50)}...`);
                    } else {
                        console.error(`Failed to insert ${key}:`, err.message);
                    }
                }

                if (inserted % 100 === 0) process.stdout.write(`.`);
            }
            console.log(`\nSuccessfully inserted ${inserted} keys.`);
        } else {
            console.log('Database is already up to date.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
