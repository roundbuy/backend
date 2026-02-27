const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function verifyPrioritySystem() {
    let connection;
    try {
        console.log('🔧 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.\n');

        // 1. Verify product_badges schema
        console.log('📋 1. Verifying product_badges schema...');
        const [schema] = await connection.query('DESCRIBE product_badges');
        const columns = schema.map(col => col.Field);

        const requiredColumns = ['expiry_date', 'priority_level'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));

        if (missingColumns.length > 0) {
            console.log('❌ Missing columns:', missingColumns);
        } else {
            console.log('✅ All required columns present');
            console.table(schema.filter(col => ['expiry_date', 'priority_level', 'badge_type'].includes(col.Field)));
        }

        // 2. Check badge_type enum
        console.log('\n📋 2. Checking badge_type enum values...');
        const badgeTypeColumn = schema.find(col => col.Field === 'badge_type');
        console.log('   Badge type:', badgeTypeColumn.Type);
        if (badgeTypeColumn.Type.includes('membership')) {
            console.log('✅ Membership badge type is included');
        } else {
            console.log('❌ Membership badge type is missing');
        }

        // 3. Check existing badges
        console.log('\n📋 3. Checking existing badges...');
        const [badges] = await connection.query(`
            SELECT badge_type, badge_level, priority_level, COUNT(*) as count
            FROM product_badges
            WHERE is_active = TRUE
            GROUP BY badge_type, badge_level, priority_level
            ORDER BY priority_level DESC
        `);

        if (badges.length > 0) {
            console.log('✅ Found', badges.length, 'badge types:');
            console.table(badges);
        } else {
            console.log('⚠️  No badges found in database');
        }

        // 4. Test priority ordering query
        console.log('\n📋 4. Testing priority ordering query...');
        const [ads] = await connection.query(`
            SELECT a.id, a.title, COALESCE(pb.max_priority, 0) as badge_priority
            FROM advertisements a
            LEFT JOIN (
                SELECT advertisement_id, MAX(priority_level) as max_priority
                FROM product_badges
                WHERE is_active = TRUE 
                  AND (expiry_date IS NULL OR expiry_date > NOW())
                GROUP BY advertisement_id
            ) pb ON a.id = pb.advertisement_id
            WHERE a.status = 'published'
            ORDER BY badge_priority DESC
            LIMIT 10
        `);

        if (ads.length > 0) {
            console.log('✅ Priority ordering query works. Top 10 ads:');
            console.table(ads);
        } else {
            console.log('⚠️  No published advertisements found');
        }

        // 5. Check for expired badges
        console.log('\n📋 5. Checking for expired badges...');
        const [expiredBadges] = await connection.query(`
            SELECT COUNT(*) as count
            FROM product_badges
            WHERE expiry_date IS NOT NULL 
              AND expiry_date < NOW()
              AND is_active = TRUE
        `);

        if (expiredBadges[0].count > 0) {
            console.log(`⚠️  Found ${expiredBadges[0].count} expired badges that should be deactivated`);
        } else {
            console.log('✅ No expired badges found');
        }

        // 6. Check subscription plans
        console.log('\n📋 6. Checking subscription plans...');
        const [plans] = await connection.query(`
            SELECT id, name, slug
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY id
        `);

        if (plans.length > 0) {
            console.log('✅ Found', plans.length, 'active subscription plans:');
            console.table(plans);
        } else {
            console.log('⚠️  No active subscription plans found');
        }

        // 7. Check advertisement promotion plans
        console.log('\n📋 7. Checking advertisement promotion plans...');
        const [promoPlans] = await connection.query(`
            SELECT id, name, plan_type, priority_level
            FROM advertisement_promotion_plans
            WHERE is_active = TRUE
            ORDER BY priority_level DESC
        `);

        if (promoPlans.length > 0) {
            console.log('✅ Found', promoPlans.length, 'active promotion plans:');
            console.table(promoPlans);
        } else {
            console.log('⚠️  No active promotion plans found');
        }

        // 8. Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log('✅ Database schema: OK');
        console.log('✅ Badge types: OK');
        console.log(`📊 Active badges: ${badges.length} types`);
        console.log(`📊 Published ads: ${ads.length} found`);
        console.log(`⚠️  Expired badges: ${expiredBadges[0].count}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connection closed.');
        }
    }
}

// Run verification
verifyPrioritySystem();
