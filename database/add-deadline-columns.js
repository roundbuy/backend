require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function checkColumns() {
    const [rows] = await promisePool.query('DESCRIBE disputes');
    console.log('Disputes table columns:');
    rows.forEach(r => console.log(`  - ${r.Field} (${r.Type})`));

    // Add missing deadline columns
    console.log('\nAdding deadline columns...');

    const deadlineColumns = [
        'dispute_deadline',
        'claim_deadline',
        'resolution_deadline'
    ];

    for (const col of deadlineColumns) {
        try {
            await promisePool.query(`ALTER TABLE disputes ADD COLUMN ${col} TIMESTAMP NULL`);
            console.log(`✅ Added ${col}`);
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`⚠️  ${col} already exists`);
            } else {
                console.error(`❌ Error adding ${col}:`, error.sqlMessage);
            }
        }
    }

    // Add indexes
    console.log('\nAdding indexes...');
    for (const col of deadlineColumns) {
        try {
            await promisePool.query(`ALTER TABLE disputes ADD INDEX idx_${col} (${col})`);
            console.log(`✅ Added index for ${col}`);
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log(`⚠️  Index for ${col} already exists`);
            }
        }
    }

    console.log('\n✅ Done!');
    process.exit(0);
}

checkColumns().catch(err => {
    console.error(err);
    process.exit(1);
});
