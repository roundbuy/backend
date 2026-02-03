const { promisePool } = require('../src/config/database');

async function main() {
    try {
        console.log('--- Checking Translation Status ---');

        // 1. Get Languages
        const [languages] = await promisePool.query('SELECT * FROM languages ORDER BY code');
        console.log(`\nFound ${languages.length} languages.`);

        // 2. Get Keys
        const [keys] = await promisePool.query('SELECT * FROM translation_keys');
        console.log(`Found ${keys.length} translation keys.`);

        // 3. Get Translations count per language
        const [counts] = await promisePool.query(`
      SELECT l.code, l.name, COUNT(t.id) as count
      FROM languages l
      LEFT JOIN translations t ON l.id = t.language_id
      GROUP BY l.id
      ORDER BY l.code
    `);

        console.log('\nTranslation coverage per language:');
        console.log('-----------------------------------');
        console.table(counts.reduce((acc, row) => {
            acc[row.code] = {
                Language: row.name,
                'Translated Keys': row.count,
                'Missing': keys.length - row.count,
                'Coverage': `${Math.round((row.count / keys.length) * 100)}%`
            };
            return acc;
        }, {}));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
