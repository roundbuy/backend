const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

async function importFaqs() {
    const sqlFilePath = path.join(__dirname, 'seed_faqs.sql');

    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Split key statements. 
        // The previous regex split(/;\r?\n/) worked for the file format.
        const statements = sql.split(/;\r?\n/);

        console.log(`Found ${statements.length} statements.`);

        const connection = await promisePool.getConnection();

        try {
            console.log('Starting transaction...');
            await connection.beginTransaction();

            let count = 0;
            for (const statement of statements) {
                let trimmed = statement.trim();
                if (!trimmed) continue;

                // Remove lines starting with --
                const lines = trimmed.split('\n');
                const validLines = lines.filter(line => !line.trim().startsWith('--'));
                trimmed = validLines.join('\n').trim();

                if (trimmed) {
                    // If the statement does not end with semicolon, we might want to append it? 
                    // query() doesn't require it.
                    await connection.query(trimmed);
                    count++;
                    if (count % 100 === 0) process.stdout.write(`.`);
                }
            }

            console.log('\nCommitting transaction...');
            await connection.commit();
            console.log(`\nSuccessfully imported ${count} statements.`);

        } catch (err) {
            console.error('Error during import, rolling back:', err);
            // Detailed error logging
            if (err.sql) {
                console.error('Failed SQL:', err.sql.substring(0, 200) + '...');
            }
            await connection.rollback();
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Failed to read or process SQL file:', err);
    } finally {
        process.exit();
    }
}

importFaqs();
