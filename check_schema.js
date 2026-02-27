const { promisePool } = require('./src/config/database');

async function checkSchema() {
    try {
        const [rows] = await promisePool.query("DESCRIBE subscription_plans");
        console.log("Subscription Plans Schema:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkSchema();
