const { promisePool } = require('../src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRewards() {
    console.log('🔍 Checking Reward Categories...');
    try {
        const [rows] = await promisePool.query('SELECT id, name, sort_order FROM reward_categories ORDER BY sort_order ASC');
        rows.forEach(r => console.log(`${r.id}: ${r.name} (Order: ${r.sort_order})`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkRewards();
