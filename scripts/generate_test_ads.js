
const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

// DB Config (Copy from src/config/database.js or use directly if transferable)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Mock Data
const AD_TITLES = [
    "Vintage Camera Lens", "Mountain Bike Pro", "Leather Sofa", "Gaming Laptop",
    "Antique Vase", "Electric Guitar", "Coffee Table", "Smart Watch Series 5",
    "Designer Handbag", "Running Shoes", "Office Chair", "Digital Camera",
    "Wooden Bookshelf", "Noise Cancelling Headphones", "Espresso Machine",
    "Yoga Mat", "Dumbbell Set", "Wireless Speaker", "Camping Tent", "Fishing Rod"
];

const DESCRIPTIONS = [
    "Barely used, in excellent condition.",
    "Brand new in box, never opened.",
    "Good condition, minor wear and tear.",
    "Vintage item, rare find!",
    "Works perfectly, selling because of upgrade."
];

async function generateAds() {
    console.log('🚀 Starting Ad Generation...');

    try {
        // 1. Get IDs to link to
        const [users] = await promisePool.query('SELECT id FROM users LIMIT 20');
        const [categories] = await promisePool.query('SELECT id FROM categories WHERE parent_id IS NULL LIMIT 20');

        if (users.length === 0 || categories.length === 0) {
            console.error('❌ Need users and categories in DB first!');
            process.exit(1);
        }

        // 2. Loop to create 50 ads
        for (let i = 0; i < 50; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];

            // Get a location for this user or use NULL (mocking location_id might fail if not exists)
            const [locations] = await promisePool.query('SELECT id FROM user_locations WHERE user_id = ? LIMIT 1', [user.id]);
            const locationId = locations.length > 0 ? locations[0].id : null;

            const title = `${AD_TITLES[Math.floor(Math.random() * AD_TITLES.length)]} #${i + 1}`;
            const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
            const price = (Math.random() * 500 + 10).toFixed(2);

            // Random Image (Placeholder)
            const images = JSON.stringify([`https://placehold.co/600x400?text=Ad+${i + 1}`]);

            // Insert Ad
            const [res] = await promisePool.query(`
                INSERT INTO advertisements 
                (user_id, title, description, images, category_id, location_id, price, status, display_duration_days, dim_unit, created_at, updated_at, start_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 30, 'cm', NOW(), NOW(), NOW())
            `, [user.id, title, description, images, category.id, locationId, price]);

            const adId = res.insertId;
            console.log(`✅ Created Ad ID: ${adId} - ${title}`);

            // 3. Random Membership Badge (Free, Gold, Orange, Green)
            const rand = Math.random();
            let badgeSlug = null;
            if (rand < 0.25) badgeSlug = 'gold';
            else if (rand < 0.5) badgeSlug = 'orange';
            else if (rand < 0.75) badgeSlug = 'green';
            // else 25% chance of no badge (Free)

            if (badgeSlug) {
                await promisePool.query(`
                    INSERT INTO product_badges (advertisement_id, badge_type, badge_level, is_active, created_at)
                    VALUES (?, 'membership', ?, 1, NOW())
                `, [adId, badgeSlug]);
                console.log(`   🔸 Assigned Badge: ${badgeSlug}`);
            }
        }

        console.log('\n🎉 Successfully generated 50 test ads!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error generating ads:', error);
        process.exit(1);
    }
}

generateAds();
