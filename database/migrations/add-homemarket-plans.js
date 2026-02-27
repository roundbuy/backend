const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function addHomeMarketPlans() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if HomeMarket plans already exist
        const [existing] = await connection.query(
            `SELECT COUNT(*) as count FROM advertisement_plans WHERE plan_type = 'home_market'`
        );

        if (existing[0].count > 0) {
            console.log('⚠️  HomeMarket plans already exist. Skipping...');
            return;
        }

        // Insert HomeMarket visibility plans
        const insertQuery = `
            INSERT INTO advertisement_plans 
            (name, slug, description, plan_type, priority_level, duration_days, duration_label, 
             base_price, discounted_price, currency_code, distance_boost_km, allows_distance_boost, 
             features, is_active, sort_order) 
            VALUES
            ('HomeMarket - Gold - 7 Days', 'homemarket-gold-7-days', 
             'Display your product in HomeMarket carousel with Gold priority for 7 days. Your product will be featured prominently with the highest visibility tier.', 
             'home_market', 80, 7, '7 days', 12.00, 6.00, 'GBP', 3, TRUE,
             '{"search_priority": true, "homemarket_tier": "gold", "gallery_enabled": true, "homepage_featured": true}', 
             TRUE, 100),

            ('HomeMarket - Orange - 7 Days', 'homemarket-orange-7-days', 
             'Display your product in HomeMarket carousel with Orange priority for 7 days. Get enhanced visibility with mid-tier priority.', 
             'home_market', 75, 7, '7 days', 10.00, 5.00, 'GBP', 3, TRUE,
             '{"search_priority": true, "homemarket_tier": "orange", "gallery_enabled": true, "homepage_featured": true}', 
             TRUE, 101),

            ('HomeMarket - Green - 7 Days', 'homemarket-green-7-days', 
             'Display your product in HomeMarket carousel with Green priority for 7 days. Get good visibility with standard tier priority.', 
             'home_market', 70, 7, '7 days', 8.00, 4.00, 'GBP', 3, TRUE,
             '{"search_priority": true, "homemarket_tier": "green", "gallery_enabled": true, "homepage_featured": true}', 
             TRUE, 102)
        `;

        await connection.query(insertQuery);
        console.log('✅ HomeMarket visibility plans created successfully!');

        // Display created plans
        const [plans] = await connection.query(
            `SELECT id, name, slug, plan_type, priority_level, base_price, discounted_price 
             FROM advertisement_plans 
             WHERE plan_type = 'home_market' 
             ORDER BY priority_level DESC`
        );

        console.log('\n📋 Created HomeMarket Plans:');
        plans.forEach(plan => {
            console.log(`   - ${plan.name} (Priority: ${plan.priority_level}, Price: £${plan.discounted_price})`);
        });

    } catch (error) {
        console.error('❌ Error adding HomeMarket plans:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnection closed.');
        }
    }
}

// Run the migration
addHomeMarketPlans()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
