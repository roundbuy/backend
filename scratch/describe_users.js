const { promisePool } = require('../src/config/database');

async function checkUsersTable() {
    try {
        const [columns] = await promisePool.execute('DESCRIBE users');
        console.log('Columns in users table:');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // Also check if admin@roundbuy.com exists and what values are in it
        const [rows] = await promisePool.execute('SELECT * FROM users WHERE email = "admin@roundbuy.com"');
        console.log('\nAdmin Row:');
        console.log(rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkUsersTable();
