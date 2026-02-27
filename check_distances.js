const { promisePool } = require('./src/config/database');

async function checkDistances() {
    try {
        const [rows] = await promisePool.query('SELECT * FROM distance_boost_plans');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDistances();
