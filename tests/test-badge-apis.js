const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/mobile-app';
let AUTH_TOKEN = ''; // Will be set after login

// Test user credentials (update with your test user)
const TEST_USER = {
    email: 'Test006@gmail.com',
    password: 'Test@123' // Update with actual password
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
    console.log('\n' + '='.repeat(60));
    log(`TEST: ${testName}`, 'cyan');
    console.log('='.repeat(60));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Test 1: Login
async function testLogin() {
    logTest('User Login');

    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);

        if (response.data.success && response.data.data.token) {
            AUTH_TOKEN = response.data.data.token;
            logSuccess('Login successful');
            logInfo(`Token: ${AUTH_TOKEN.substring(0, 20)}...`);
            logInfo(`User ID: ${response.data.data.user.id}`);
            logInfo(`Subscription: ${response.data.data.user.subscription_plan_id || 'None'}`);
            return true;
        } else {
            logError('Login failed - no token received');
            return false;
        }
    } catch (error) {
        logError(`Login failed: ${error.message}`);
        return false;
    }
}

// Test 2: Browse Advertisements (with badge priority)
async function testBrowseAdvertisements() {
    logTest('Browse Advertisements (Badge Priority Ordering)');

    const result = await apiRequest('GET', '/advertisements/browse?page=1&limit=10');

    if (result.success) {
        const ads = result.data.data.advertisements;
        logSuccess(`Found ${ads.length} advertisements`);

        if (ads.length > 0) {
            console.log('\nTop 5 Ads by Priority:');
            console.table(ads.slice(0, 5).map(ad => ({
                ID: ad.id,
                Title: ad.title.substring(0, 30),
                'Badge Priority': ad.badge_priority || 0,
                Price: ad.price
            })));

            // Verify ordering
            let isCorrectOrder = true;
            for (let i = 1; i < ads.length; i++) {
                if ((ads[i - 1].badge_priority || 0) < (ads[i].badge_priority || 0)) {
                    isCorrectOrder = false;
                    break;
                }
            }

            if (isCorrectOrder) {
                logSuccess('Badge priority ordering is correct (DESC)');
            } else {
                logError('Badge priority ordering is incorrect');
            }
        }
    } else {
        logError(`Browse failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 3: Browse with Filters (ensure filters still work)
async function testBrowseWithFilters() {
    logTest('Browse Advertisements with Filters');

    // Test with price filter
    const result = await apiRequest('GET', '/advertisements/browse?min_price=100&max_price=5000&page=1&limit=5');

    if (result.success) {
        const ads = result.data.data.advertisements;
        logSuccess(`Found ${ads.length} advertisements with price filter`);

        if (ads.length > 0) {
            const allInRange = ads.every(ad => ad.price >= 100 && ad.price <= 5000);
            if (allInRange) {
                logSuccess('Price filter working correctly');
            } else {
                logError('Price filter not working correctly');
            }

            console.log('\nFiltered Results:');
            console.table(ads.map(ad => ({
                ID: ad.id,
                Title: ad.title.substring(0, 25),
                Price: ad.price,
                Priority: ad.badge_priority || 0
            })));
        }
    } else {
        logError(`Browse with filters failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 4: Sync Advertisement Badges
async function testSyncBadges() {
    logTest('Sync Advertisement Badges');

    const result = await apiRequest('POST', '/advertisements/sync-badges');

    if (result.success) {
        const data = result.data.data;
        logSuccess('Badge sync completed');
        logInfo(`Synced: ${data.synced_count}/${data.total_ads} ads`);
        logInfo(`Subscription Tier: ${data.subscription_tier || 'None'}`);
    } else {
        logError(`Sync badges failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 5: Get Advertisement Plans
async function testGetAdvertisementPlans() {
    logTest('Get Advertisement Plans');

    const result = await apiRequest('GET', '/advertisements/plans');

    if (result.success) {
        const plans = result.data.data.plans;
        logSuccess(`Found ${plans.length} advertisement plans`);

        console.log('\nAvailable Plans:');
        console.table(plans.map(plan => ({
            ID: plan.id,
            Name: plan.name,
            Type: plan.plan_type,
            Priority: plan.priority_level,
            Price: plan.price
        })));
    } else {
        logError(`Get plans failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 6: Get Promotion Plans
async function testGetPromotionPlans() {
    logTest('Get Promotion Plans');

    const result = await apiRequest('GET', '/promotions/plans');

    if (result.success) {
        const plans = result.data.data.plans;
        logSuccess(`Found ${plans.length} promotion plans`);

        if (plans.length > 0) {
            console.log('\nPromotion Plans:');
            console.table(plans.slice(0, 5).map(plan => ({
                ID: plan.id,
                Name: plan.name,
                Type: plan.plan_type,
                Priority: plan.priority_level,
                Price: plan.price
            })));
        }
    } else {
        logError(`Get promotion plans failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 7: Get Subscription Plans
async function testGetSubscriptionPlans() {
    logTest('Get Subscription Plans');

    const result = await apiRequest('GET', '/subscription/plans');

    if (result.success) {
        const plans = result.data.data.plans;
        logSuccess(`Found ${plans.length} subscription plans`);

        console.log('\nSubscription Plans:');
        console.table(plans.map(plan => ({
            ID: plan.id,
            Name: plan.name,
            Slug: plan.slug,
            Type: plan.plan_type,
            Duration: plan.duration_days + ' days'
        })));
    } else {
        logError(`Get subscription plans failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 8: Get User's Advertisements
async function testGetUserAdvertisements() {
    logTest('Get User Advertisements');

    const result = await apiRequest('GET', '/advertisements?status=published&limit=5');

    if (result.success) {
        const ads = result.data.data.advertisements;
        logSuccess(`Found ${ads.length} user advertisements`);

        if (ads.length > 0) {
            console.log('\nUser Ads:');
            console.table(ads.map(ad => ({
                ID: ad.id,
                Title: ad.title.substring(0, 30),
                Status: ad.status,
                Price: ad.price
            })));
        }
    } else {
        logError(`Get user ads failed: ${JSON.stringify(result.error)}`);
    }
}

// Test 9: Check Database Badge Status
async function testDatabaseBadgeStatus() {
    logTest('Database Badge Status Check');

    const mysql = require('mysql2/promise');
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '../.env') });

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy'
        });

        // Check badge distribution
        const [badges] = await connection.query(`
      SELECT badge_type, badge_level, priority_level, COUNT(*) as count
      FROM product_badges
      WHERE is_active = TRUE
      GROUP BY badge_type, badge_level, priority_level
      ORDER BY priority_level DESC
    `);

        logSuccess('Database connection successful');
        console.log('\nActive Badges Distribution:');
        console.table(badges);

        // Check for expired badges
        const [expired] = await connection.query(`
      SELECT COUNT(*) as count
      FROM product_badges
      WHERE expiry_date IS NOT NULL 
        AND expiry_date < NOW()
        AND is_active = TRUE
    `);

        if (expired[0].count > 0) {
            logError(`Found ${expired[0].count} expired badges that should be deactivated`);
        } else {
            logSuccess('No expired badges found');
        }

        await connection.end();
    } catch (error) {
        logError(`Database check failed: ${error.message}`);
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         BADGE SYSTEM API COMPREHENSIVE TEST SUITE         ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    const startTime = Date.now();

    // Run tests sequentially
    const loginSuccess = await testLogin();

    if (!loginSuccess) {
        logError('Cannot proceed without authentication');
        return;
    }

    await testBrowseAdvertisements();
    await testBrowseWithFilters();
    await testSyncBadges();
    await testGetAdvertisementPlans();
    await testGetPromotionPlans();
    await testGetSubscriptionPlans();
    await testGetUserAdvertisements();
    await testDatabaseBadgeStatus();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                    TEST SUITE COMPLETED                    ║', 'green');
    log(`║              Total Duration: ${duration} seconds                  ║`, 'green');
    log('╚════════════════════════════════════════════════════════════╝', 'green');
}

// Run tests
runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
});
