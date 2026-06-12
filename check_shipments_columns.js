const { promisePool } = require('./src/config/database');

async function check() {
    try {
        const [tables] = await promisePool.query('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]));

        const [columns] = await promisePool.query('DESCRIBE postage_shipments');
        console.log('\npostage_shipments columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (Null: ${col.Null}, Key: ${col.Key}, Default: ${col.Default})`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error describing table:', err.message);
        process.exit(1);
    }
}

check();
