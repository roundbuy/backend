const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function createTestBadges() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Get existing published advertisements
        const [existingAds] = await connection.query(`
            SELECT id FROM advertisements 
            WHERE status = 'published' 
            ORDER BY created_at DESC 
            LIMIT 35
        `);

        if (existingAds.length < 25) {
            console.log(`⚠️  Not enough existing advertisements. Need at least 25 published ads.`);
            console.log(`   Found: ${existingAds.length} ads`);
            return;
        }

        console.log(`📋 Found ${existingAds.length} existing advertisements`);

        // Clear existing test badges
        await connection.query(`DELETE FROM product_badges WHERE badge_type = 'visibility'`);
        console.log('✅ Cleared existing visibility badges');

        // Assign first 5 ads as promotions
        const promotionAds = existingAds.slice(0, 5);
        const visibilityTypes = ['rise_to_top', 'top_spot', 'fast', 'targeted', 'rise_to_top'];

        console.log('\n📋 Creating promotion badges...');
        for (let i = 0; i < promotionAds.length; i++) {
            const adId = promotionAds[i].id;
            const badgeType = visibilityTypes[i];

            // Get the plan for this badge type
            const [plans] = await connection.query(`
                SELECT id, priority_level FROM advertisement_plans 
                WHERE plan_type = ? AND is_active = TRUE 
                LIMIT 1
            `, [badgeType]);

            if (plans.length > 0) {
                await connection.query(`
                    INSERT INTO product_badges 
                    (advertisement_id, badge_type, badge_level, priority_level, is_active, expiry_date)
                    VALUES (?, 'visibility', ?, ?, TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY))
                `, [adId, badgeType, plans[0].priority_level]);
            }
        }
        console.log(`✅ Added visibility badges to ${promotionAds.length} promotion ads`);

        // Create ShowCasing groups (ads 6-19, two groups of 7 products each)
        const showcaseAds = existingAds.slice(5, 19);

        console.log('\n📋 Creating ShowCasing groups...');
        if (showcaseAds.length >= 14) {
            // Create 2 showcase groups
            const showcaseGroupsCreated = [];

            for (let groupIndex = 0; groupIndex < 2; groupIndex++) {
                const showcaseGroupId = 1000 + groupIndex + 1; // Use unique group IDs (1001, 1002)

                // Add 7 products to this showcase group
                const startIdx = groupIndex * 7;
                const endIdx = startIdx + 7;

                for (let i = startIdx; i < endIdx; i++) {
                    await connection.query(`
                        INSERT INTO product_badges 
                        (advertisement_id, badge_type, badge_level, showcase_group_id, priority_level, is_active, expiry_date)
                        VALUES (?, 'visibility', 'show_casing', ?, 90, TRUE, DATE_ADD(NOW(), INTERVAL 30 DAY))
                    `, [showcaseAds[i].id, showcaseGroupId]);
                }

                showcaseGroupsCreated.push(showcaseGroupId);
                console.log(`   ✅ Created showcase group ${showcaseGroupId} with 7 products`);
            }

            console.log(`✅ Created ${showcaseGroupsCreated.length} ShowCasing groups`);
        } else {
            console.log(`⚠️  Not enough ads for ShowCasing groups (need at least 14, found ${showcaseAds.length})`);
        }

        // Assign ads 20-29 as HomeMarket (10 ads)
        const homemarketAds = existingAds.slice(19, 29);
        const homemarketTiers = ['homemarket-gold-7-days', 'homemarket-orange-7-days', 'homemarket-green-7-days'];
        const tierPriorities = [80, 75, 70];

        console.log('\n📋 Creating HomeMarket badges...');
        for (let i = 0; i < homemarketAds.length; i++) {
            const adId = homemarketAds[i].id;
            const tierIndex = i % 3;
            const tier = homemarketTiers[tierIndex];
            const priority = tierPriorities[tierIndex];

            await connection.query(`
                INSERT INTO product_badges 
                (advertisement_id, badge_type, badge_level, priority_level, is_active, expiry_date)
                VALUES (?, 'visibility', ?, ?, TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY))
            `, [adId, tier, priority]);
        }
        console.log(`✅ Added HomeMarket badges to ${homemarketAds.length} ads`);

        // Remaining ads stay as standard (no badges)
        const standardCount = existingAds.length - promotionAds.length - showcaseAds.length - homemarketAds.length;

        console.log('\n✅ Test data creation completed!');
        console.log(`\n📊 Summary:`);
        console.log(`   - ${promotionAds.length} promotion ads (with visibility badges)`);
        console.log(`   - 2 ShowCasing groups (14 ads total, 7 per group)`);
        console.log(`   - ${homemarketAds.length} homemarket ads (Gold/Orange/Green)`);
        console.log(`   - ${standardCount} standard ads (no badges)`);
        console.log(`   - Total: ${existingAds.length} ads`);

    } catch (error) {
        console.error('❌ Error creating test data:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnection closed.');
        }
    }
}

// Run the script
createTestBadges()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
