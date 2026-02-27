const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function seedBannerAds() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if banner ads already exist
        const [existing] = await connection.query(
            `SELECT COUNT(*) as count FROM banners WHERE title LIKE 'Test Banner%'`
        );

        if (existing[0].count >= 5) {
            console.log('⚠️  Test banner ads already exist. Skipping...');
            return;
        }

        // Get a test user ID (use first user or create a system user)
        const [users] = await connection.query(`SELECT id FROM users LIMIT 1`);
        if (users.length === 0) {
            throw new Error('No users found in database. Please create a user first.');
        }
        const userId = users[0].id;

        // Get or create a banner plan
        let bannerPlanId;
        const [plans] = await connection.query(`SELECT id FROM banner_plans LIMIT 1`);
        if (plans.length === 0) {
            // Create a basic banner plan
            const [result] = await connection.query(`
                INSERT INTO banner_plans (name, slug, duration_days, price, placement, is_active)
                VALUES ('Basic Banner Plan', 'basic-banner', 30, 50.00, 'home_top', TRUE)
            `);
            bannerPlanId = result.insertId;
            console.log('✅ Created basic banner plan');
        } else {
            bannerPlanId = plans[0].id;
        }

        // Clear existing test banners
        await connection.query(`DELETE FROM banners WHERE title LIKE 'Test Banner%'`);

        // Insert sample banner ads with different sizes
        const insertQuery = `
            INSERT INTO banners 
            (user_id, banner_plan_id, title, image_url, link_url, size, placement, status, start_date, end_date, created_at) 
            VALUES
            (?, ?, 'Test Banner - Small 1', 
             'https://via.placeholder.com/300x150/FF6B6B/FFFFFF%3Ftext=Small+Ad+1', 
             'https://example.com/ad1', 'small', 'search_listing', 'published', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),

            (?, ?, 'Test Banner - Small 2', 
             'https://via.placeholder.com/300x150/4ECDC4/FFFFFF%3Ftext=Small+Ad+2', 
             'https://example.com/ad2', 'small', 'search_listing', 'published', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),

            (?, ?, 'Test Banner - Medium 1', 
             'https://via.placeholder.com/600x200/95E1D3/FFFFFF%3Ftext=Medium+Ad', 
             'https://example.com/ad3', 'medium', 'search_listing', 'published', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),

            (?, ?, 'Test Banner - Large 1', 
             'https://via.placeholder.com/600x400/F38181/FFFFFF%3Ftext=Large+Ad', 
             'https://example.com/ad4', 'large', 'search_listing', 'published', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),

            (?, ?, 'Test Banner - Medium 2', 
             'https://via.placeholder.com/600x200/AA96DA/FFFFFF%3Ftext=Medium+Ad+2', 
             'https://example.com/ad5', 'medium', 'search_listing', 'published', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
        `;

        await connection.query(insertQuery, [
            userId, bannerPlanId,
            userId, bannerPlanId,
            userId, bannerPlanId,
            userId, bannerPlanId,
            userId, bannerPlanId
        ]);
        console.log('✅ Banner ads seeded successfully!');

        // Display created banners
        const [banners] = await connection.query(
            `SELECT id, title, size, link_url, status 
             FROM banners 
             WHERE status = 'published' 
             ORDER BY id DESC 
             LIMIT 5`
        );

        console.log('\n📋 Created Banner Ads:');
        banners.forEach(banner => {
            console.log(`   - ${banner.title} (Size: ${banner.size}, ID: ${banner.id})`);
        });

    } catch (error) {
        console.error('❌ Error seeding banner ads:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnection closed.');
        }
    }
}

// Run the seeder
seedBannerAds()
    .then(() => {
        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    });
