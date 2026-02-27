const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

// Priority levels mapping
const PRIORITY_LEVELS = {
    'top_spot': 100,
    'rise_to_top': 90,
    'targeted': 80,
    'fast': 80,
    'fast_ad': 80,
    'diligent_seller': 70,
    'gold': 60,
    'orange': 50,
    'green': 40
};

async function updateExistingBadges() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.\n');

        // Get all existing badges
        const [badges] = await connection.query(`
            SELECT id, badge_type, badge_level, priority_level
            FROM product_badges
            WHERE is_active = TRUE
        `);

        console.log(`📋 Found ${badges.length} active badges to update\n`);

        let updatedCount = 0;
        for (const badge of badges) {
            const newPriority = PRIORITY_LEVELS[badge.badge_level.toLowerCase()] || 0;

            if (newPriority !== badge.priority_level) {
                await connection.query(
                    'UPDATE product_badges SET priority_level = ? WHERE id = ?',
                    [newPriority, badge.id]
                );
                console.log(`✅ Updated badge ${badge.id} (${badge.badge_level}): ${badge.priority_level} → ${newPriority}`);
                updatedCount++;
            }
        }

        console.log(`\n✅ Updated ${updatedCount} badges with correct priority levels`);

        // Verify the update
        console.log('\n📊 Verification - Badge distribution by priority:');
        const [distribution] = await connection.query(`
            SELECT badge_type, badge_level, priority_level, COUNT(*) as count
            FROM product_badges
            WHERE is_active = TRUE
            GROUP BY badge_type, badge_level, priority_level
            ORDER BY priority_level DESC
        `);
        console.table(distribution);

    } catch (error) {
        console.error('❌ Error updating badges:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run update
updateExistingBadges();
