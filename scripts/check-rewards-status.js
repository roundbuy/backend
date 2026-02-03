const { promisePool } = require('../src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRewardsActive() {
    console.log('🔍 Checking Reward Categories Status...');
    try {
        const [rows] = await promisePool.query('SELECT id, name, sort_order, is_active FROM reward_categories ORDER BY sort_order ASC');
        rows.forEach(r => console.log(`${r.id}: ${r.name} (Order: ${r.sort_order}, Active: ${r.is_active})`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkRewardsActive();
