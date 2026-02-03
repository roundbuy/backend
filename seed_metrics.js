
const path = require('path');
require('dotenv').config();
const { promisePool } = require('./src/config/database');

async function seedData() {
    console.log('Checking database connection object:', promisePool);

    if (!promisePool || typeof promisePool.query !== 'function') {
        console.error('ERROR: promisePool is not valid or does not have query method');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        // Get all users who are sellers (or just all users to be safe)
        const [users] = await promisePool.query('SELECT id, full_name, role FROM users');

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            // Only add if not already there? The INSERT ON DUPLICATE UPDATE handles it.
            // But we want to ensure we don't zero out valid data if we calculate it? 
            // The user asked for DUMMY data. So overwriting is fine or even desired.
            console.log(`Seeding metrics for user: ${user.full_name} (${user.id})`);

            // Randomize metrics
            const responseTime = Math.floor(Math.random() * 120) + 5; // 5 to 125 mins
            const pickupRate = (Math.random() * 20 + 80).toFixed(2); // 80% to 100%
            const fastReplyRate = (Math.random() * 30 + 70).toFixed(2); // 70% to 100%
            const salesRate = (Math.random() * 40 + 60).toFixed(2); // 60% to 100%
            const disputeRate = (Math.random() * 10 + 90).toFixed(2); // 90% to 100%

            await promisePool.query(
                `INSERT INTO seller_metrics 
                (user_id, avg_response_time_minutes, pickup_meeting_attendance_rate, questions_answered_within_2h_rate, successful_sales_rate, dispute_resolution_rate)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                avg_response_time_minutes = VALUES(avg_response_time_minutes),
                pickup_meeting_attendance_rate = VALUES(pickup_meeting_attendance_rate),
                questions_answered_within_2h_rate = VALUES(questions_answered_within_2h_rate),
                successful_sales_rate = VALUES(successful_sales_rate),
                dispute_resolution_rate = VALUES(dispute_resolution_rate)`,
                [user.id, responseTime, pickupRate, fastReplyRate, salesRate, disputeRate]
            );
        }

        console.log('✅ Seeded seller metrics successfully');
        process.exit(0);

    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seedData();
