/**
 * Quick API Test Script for Feedback Endpoints
 * Run this to verify all feedback endpoints are working
 * 
 * Usage: node test-feedback-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/mobile-app';
let authToken = '';

// Test user credentials (update these with actual test credentials)
const TEST_USER = {
    email: 'test@example.com',
    password: 'testpassword123'
};

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

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function login() {
    try {
        logInfo('Attempting to login...');
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);

        if (response.data.success && response.data.data.access_token) {
            authToken = response.data.data.access_token;
            logSuccess('Login successful!');
            return true;
        } else {
            logError('Login failed: No access token received');
            return false;
        }
    } catch (error) {
        logError(`Login failed: ${error.response?.data?.message || error.message}`);
        logWarning('Please update TEST_USER credentials in this script');
        return false;
    }
}

async function testEndpoint(name, method, endpoint, data = null) {
    try {
        logInfo(`Testing: ${name}`);

        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);

        if (response.data.success) {
            logSuccess(`${name} - SUCCESS`);
            console.log('   Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
            return true;
        } else {
            logWarning(`${name} - Response not successful`);
            console.log('   Response:', response.data);
            return false;
        }
    } catch (error) {
        if (error.response?.status === 404) {
            logError(`${name} - ENDPOINT NOT FOUND (404)`);
        } else if (error.response?.status === 401) {
            logError(`${name} - UNAUTHORIZED (401) - Token may be invalid`);
        } else {
            logError(`${name} - FAILED: ${error.response?.data?.message || error.message}`);
        }
        if (error.response?.data) {
            console.log('   Error details:', error.response.data);
        }
        return false;
    }
}

async function runTests() {
    log('\n========================================', 'blue');
    log('  Feedback API Endpoint Tests', 'blue');
    log('========================================\n', 'blue');

    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        logError('\nTests aborted: Login failed');
        logWarning('Please ensure:');
        console.log('  1. Backend server is running (npm run dev)');
        console.log('  2. Database is accessible');
        console.log('  3. Test user credentials are correct in this script');
        process.exit(1);
    }

    console.log('\n');

    // Step 2: Test all feedback endpoints
    const results = {
        passed: 0,
        failed: 0
    };

    // Test 1: Get eligible transactions for feedback
    if (await testEndpoint(
        'Get Eligible Transactions',
        'GET',
        '/feedbacks/eligible'
    )) {
        results.passed++;
    } else {
        results.failed++;
    }

    console.log('\n');

    // Test 2: Get my feedbacks
    if (await testEndpoint(
        'Get My Feedbacks',
        'GET',
        '/feedbacks/my-feedbacks?limit=10&offset=0'
    )) {
        results.passed++;
    } else {
        results.failed++;
    }

    console.log('\n');

    // Test 3: Get user feedbacks (using own user ID as example)
    if (await testEndpoint(
        'Get User Feedbacks',
        'GET',
        '/feedbacks/user/1'
    )) {
        results.passed++;
    } else {
        results.failed++;
    }

    console.log('\n');

    // Test 4: Get feedback stats
    if (await testEndpoint(
        'Get Feedback Stats',
        'GET',
        '/feedbacks/stats/1'
    )) {
        results.passed++;
    } else {
        results.failed++;
    }

    console.log('\n');

    // Test 5: Check if can give feedback
    if (await testEndpoint(
        'Check Can Give Feedback',
        'GET',
        '/feedbacks/can-give/1'
    )) {
        results.passed++;
    } else {
        results.failed++;
    }

    console.log('\n');

    // Test 6: Create feedback (this will likely fail without valid data, but tests the endpoint)
    logInfo('Note: Create Feedback test may fail if no valid transaction exists');
    if (await testEndpoint(
        'Create Feedback',
        'POST',
        '/feedbacks',
        {
            advertisementId: 1,
            reviewedUserId: 2,
            rating: 5,
            comment: 'Test feedback from API test script',
            transactionType: 'sell'
        }
    )) {
        results.passed++;
    } else {
        results.failed++;
        logWarning('This is expected if no valid transaction exists for testing');
    }

    // Summary
    console.log('\n');
    log('========================================', 'blue');
    log('  Test Summary', 'blue');
    log('========================================', 'blue');
    log(`Total Tests: ${results.passed + results.failed}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log('========================================\n', 'blue');

    if (results.failed === 0) {
        logSuccess('All tests passed! ✨');
    } else if (results.passed > 0) {
        logWarning('Some tests failed, but core endpoints are working');
    } else {
        logError('All tests failed - please check backend configuration');
    }
}

// Run the tests
runTests().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
