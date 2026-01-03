const { promisePool } = require('./src/config/database');

async function test() {
    try {
        console.log('Testing promisePool...');
        console.log('promisePool type:', typeof promisePool);
        console.log('promisePool.getConnection type:', typeof promisePool.getConnection);
        
        const connection = await promisePool.getConnection();
        console.log('✅ Connection successful!');
        connection.release();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

test();
