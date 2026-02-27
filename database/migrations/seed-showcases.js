const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

/**
 * Seed test ShowCasing badges
 * Creates showcase groups for testing
 */
async function seedShowcases() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.\n');

        // Get some published ads from different users
        const [ads] = await connection.query(`
            SELECT a.id, a.user_id, a.title, u.email
            FROM advertisements a
            JOIN users u ON a.user_id = u.id
            WHERE a.status = 'published'
            ORDER BY a.user_id, a.created_at DESC
            LIMIT 30
        `);

        if (ads.length < 7) {
            console.log('⚠️  Not enough published ads to create showcases (need at least 7)');
            return;
        }

        console.log(`📊 Found ${ads.length} published ads\n`);

        // Group ads by user
        const adsByUser = {};
        ads.forEach(ad => {
            if (!adsByUser[ad.user_id]) {
                adsByUser[ad.user_id] = [];
            }
            adsByUser[ad.user_id].push(ad);
        });

        let showcaseCount = 0;

        // Create showcases for users with 7+ ads
        for (const [userId, userAds] of Object.entries(adsByUser)) {
            if (userAds.length >= 7) {
                // Take first 7-10 ads for showcase
                const showcaseAds = userAds.slice(0, Math.min(10, userAds.length));
                const showcaseGroupId = `showcase_${userId}_${Date.now()}_${showcaseCount}`;

                console.log(`\n📦 Creating showcase for user ${userId} (${userAds[0].email})`);
                console.log(`   Products: ${showcaseAds.length}`);

                // Calculate expiry date (30 days from now)
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);

                // Create badges for each ad in the showcase
                for (const ad of showcaseAds) {
                    // Check if badge already exists
                    const [existing] = await connection.query(`
                        SELECT id FROM product_badges 
                        WHERE advertisement_id = ? 
                          AND badge_type = 'visibility'
                          AND badge_level = 'show_casing'
                          AND is_active = TRUE
                    `, [ad.id]);

                    if (existing.length > 0) {
                        console.log(`   ⚠️  Badge already exists for ad ${ad.id}, skipping`);
                        continue;
                    }

                    await connection.query(`
                        INSERT INTO product_badges 
                        (advertisement_id, badge_type, badge_level, priority_level, 
                         expiry_date, showcase_group_id, is_active)
                        VALUES (?, 'visibility', 'show_casing', 75, ?, ?, TRUE)
                    `, [ad.id, expiryDate, showcaseGroupId]);

                    console.log(`   ✅ Added showcase badge to ad ${ad.id} (${ad.title.substring(0, 30)}...)`);
                }

                showcaseCount++;

                // Create max 2 showcases for testing
                if (showcaseCount >= 2) break;
            }
        }

        if (showcaseCount === 0) {
            console.log('\n⚠️  No users found with 7+ published ads to create showcases');
        } else {
            console.log(`\n✅ Created ${showcaseCount} showcase(s) successfully!`);
        }

        // Display summary
        console.log('\n📊 Showcase Summary:');
        const [showcases] = await connection.query(`
            SELECT 
                showcase_group_id,
                COUNT(*) as product_count,
                MIN(expiry_date) as expires_at
            FROM product_badges
            WHERE badge_type = 'visibility'
              AND badge_level = 'show_casing'
              AND is_active = TRUE
              AND showcase_group_id IS NOT NULL
            GROUP BY showcase_group_id
        `);

        console.table(showcases);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run seeding
seedShowcases();
