const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy_db'
};

/**
 * Create test advertisements for showcase testing
 */
async function createTestAds() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.\n');

        // Get first user
        const [users] = await connection.query(`
            SELECT id, email FROM users LIMIT 2
        `);

        if (users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }

        console.log(`📊 Found ${users.length} user(s)\n`);

        // Get a category
        const [categories] = await connection.query(`
            SELECT id FROM categories WHERE is_active = TRUE LIMIT 1
        `);

        if (categories.length === 0) {
            console.log('❌ No categories found');
            return;
        }

        const categoryId = categories[0].id;

        // Product templates
        const products = [
            { title: 'Red Handbag', price: 300, description: 'Beautiful red leather handbag' },
            { title: 'Work Boots', price: 100, description: 'Durable work boots' },
            { title: 'Blue Jacket', price: 100, description: 'Stylish blue jacket' },
            { title: 'Leather Football', price: 30, description: 'Professional leather football' },
            { title: 'Running Shoes', price: 150, description: 'Comfortable running shoes' },
            { title: 'Winter Coat', price: 250, description: 'Warm winter coat' },
            { title: 'Designer Watch', price: 500, description: 'Luxury designer watch' },
            { title: 'Laptop Bag', price: 80, description: 'Professional laptop bag' },
            { title: 'Sports Jersey', price: 60, description: 'Official sports jersey' },
            { title: 'Sunglasses', price: 120, description: 'Polarized sunglasses' }
        ];

        let totalCreated = 0;

        for (const user of users) {
            console.log(`\n👤 Creating ads for user ${user.email}...`);

            for (const product of products) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 60);

                await connection.query(`
                    INSERT INTO advertisements
                    (user_id, title, description, price, category_id, status, 
                     display_duration_days, start_date, end_date, created_at)
                    VALUES (?, ?, ?, ?, ?, 'published', 60, NOW(), ?, NOW())
                `, [user.id, product.title, product.description, product.price, categoryId, endDate]);

                console.log(`   ✅ Created: ${product.title}`);
                totalCreated++;
            }
        }

        console.log(`\n✅ Created ${totalCreated} test advertisements!`);

        // Show summary
        const [summary] = await connection.query(`
            SELECT u.email, COUNT(a.id) as ad_count
            FROM users u
            LEFT JOIN advertisements a ON u.id = a.user_id AND a.status = 'published'
            GROUP BY u.id, u.email
            HAVING ad_count > 0
            ORDER BY ad_count DESC
            LIMIT 5
        `);

        console.log('\n📊 Ads per user:');
        console.table(summary);

    } catch (error) {
        console.error('❌ Failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run
createTestAds();
