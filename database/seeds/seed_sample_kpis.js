/**
 * Seed Sample KPIs & Survey responses
 * Run: node backend/database/seeds/seed_sample_kpis.js
 */
const { promisePool } = require('../../src/config/database');

async function seed() {
    try {
        console.log('🔗 Connecting to the database...');

        // 1. Fetch some user IDs to associate, fallback to null/anonymous if none exist
        const [users] = await promisePool.query('SELECT id FROM users LIMIT 10');
        const userIds = users.map(u => u.id);
        console.log(`✓ Found ${userIds.length} users to associate with survey feedback.`);

        const getRandomUserId = () => userIds.length > 0 ? userIds[Math.floor(Math.random() * userIds.length)] : null;

        // 2. Clear old mock data if exists to make it repeatable
        console.log('🧹 Clearing old mock survey and traffic data...');
        await promisePool.query('DELETE FROM surveys_nps');
        await promisePool.query('DELETE FROM surveys_beta_feedback');
        await promisePool.query('DELETE FROM traffic_analytics');

        // 3. Seed surveys_nps
        console.log('🌱 Seeding surveys_nps...');
        const npsEntries = [];
        const roles = ['buyer', 'seller'];
        // Generate 100 random NPS scores
        for (let i = 0; i < 100; i++) {
            const role = roles[Math.floor(Math.random() * roles.length)];
            // Bias scores high for promoters (9-10) and detractors (0-6)
            let score;
            const rand = Math.random();
            if (rand < 0.6) {
                score = Math.floor(Math.random() * 2) + 9; // 9 or 10
            } else if (rand < 0.8) {
                score = Math.floor(Math.random() * 2) + 7; // 7 or 8
            } else {
                score = Math.floor(Math.random() * 7); // 0 to 6
            }

            let comment = null;
            if (score >= 9) {
                comment = 'Great experience! Clean UI, fast transactions.';
            } else if (score <= 6) {
                comment = 'The app was slow during checkout and the navigation is confusing.';
            }

            const userId = getRandomUserId();
            // Generate dates within the last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            npsEntries.push([userId, role, score, comment, createdAt]);
        }

        const insertNpsQuery = 'INSERT INTO surveys_nps (user_id, role, score, comment, created_at) VALUES ?';
        await promisePool.query(insertNpsQuery, [npsEntries]);
        console.log('✅ NPS surveys seeded successfully.');

        // 4. Seed surveys_beta_feedback
        console.log('🌱 Seeding surveys_beta_feedback...');
        const betaEntries = [];
        const platforms = ['web', 'android', 'ios'];
        const commentsByRound = {
            1: ['Signup was smooth.', 'Email verification was slow.', 'MFA is easy to configure.'],
            2: ['Search results map is fast.', 'Filter options are responsive.', 'Found clothes in my UK size.'],
            3: ['Stripe payment works well.', 'Evri postage label was downloadable.', 'Checkout fee schedule is transparent.'],
            4: ['Wallet balance parsed correctly.', 'Dispute window is straightforward.', 'Withdrawal request completed in 24h.']
        };

        for (let i = 0; i < 80; i++) {
            const round = Math.floor(Math.random() * 4) + 1; // 1-4
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            const rating = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
            const isPositive = rating >= 4 ? 1 : 0;
            
            const comments = commentsByRound[round];
            const feedbackText = comments[Math.floor(Math.random() * comments.length)];
            
            const userId = getRandomUserId();
            const daysAgo = Math.floor(Math.random() * 30);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            betaEntries.push([userId, round, platform, rating, isPositive, feedbackText, createdAt]);
        }

        const insertBetaQuery = 'INSERT INTO surveys_beta_feedback (user_id, round, platform, rating, is_positive, feedback_text, created_at) VALUES ?';
        await promisePool.query(insertBetaQuery, [betaEntries]);
        console.log('✅ Beta testing feedback seeded successfully.');

        // 5. Seed traffic_analytics
        console.log('🌱 Seeding traffic_analytics...');
        const trafficSources = ['organic', 'paid', 'referral', 'chatgpt', 'gemini', 'perplexity', 'google_ai_overview'];
        const trafficEntries = [];

        // Seed daily stats for the last 30 days
        for (let day = 0; day < 30; day++) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            const dateString = date.toISOString().slice(0, 10);

            trafficSources.forEach(source => {
                // Generate realistic traffic counts
                let baseCount = 50;
                if (source === 'organic') baseCount = 200;
                if (source === 'paid') baseCount = 120;
                if (source === 'chatgpt') baseCount = 80;
                if (source === 'google_ai_overview') baseCount = 60;
                if (source === 'gemini') baseCount = 45;
                if (source === 'perplexity') baseCount = 35;
                if (source === 'referral') baseCount = 30;

                const variance = Math.floor((Math.random() - 0.5) * (baseCount * 0.3));
                const visitorCount = Math.max(1, baseCount + variance);

                trafficEntries.push([source, visitorCount, dateString]);
            });
        }

        const insertTrafficQuery = 'INSERT INTO traffic_analytics (source_name, visitor_count, date) VALUES ?';
        await promisePool.query(insertTrafficQuery, [trafficEntries]);
        console.log('✅ Traffic analytics seeded successfully.');

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding KPI data:', error);
        process.exit(1);
    }
}

seed();
