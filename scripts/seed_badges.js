const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

const BADGE_CONFIG = [
    // Rewards
    { type: 'reward', level: 'lottery' },
    { type: 'reward', level: 'top_search' },

    // Membership
    { type: 'membership', level: 'green' },
    { type: 'membership', level: 'gold' },
    { type: 'membership', level: 'orange' },

    // Visibility Plans
    { type: 'visibility', level: 'rise_to_top' },
    { type: 'visibility', level: 'top_spot' },
    { type: 'visibility', level: 'show_casing' },
    { type: 'visibility', level: 'targeted' },
    { type: 'visibility', level: 'fast_ad' }
];

async function seedBadges() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Get all advertisement IDs
        const [ads] = await connection.query('SELECT id FROM advertisements');
        console.log(`Found ${ads.length} advertisements.`);

        // Clear existing badges
        await connection.query('DELETE FROM product_badges');
        console.log('Cleared existing badges.');

        // Randomly assign badges
        let badgeCount = 0;
        for (const ad of ads) {
            // 70% chance to get at least one badge
            if (Math.random() < 0.7) {
                // Determine how many badges (1 to 3)
                const numBadges = Math.floor(Math.random() * 3) + 1;

                // Shuffle config to get random unique badges
                const shuffled = BADGE_CONFIG.sort(() => 0.5 - Math.random());
                const selectedBadges = shuffled.slice(0, numBadges);

                for (const badge of selectedBadges) {
                    await connection.query(
                        'INSERT INTO product_badges (advertisement_id, badge_type, badge_level) VALUES (?, ?, ?)',
                        [ad.id, badge.type, badge.level]
                    );
                    badgeCount++;
                }
            }
        }

        console.log(`Seeded ${badgeCount} badges.`);

    } catch (error) {
        console.error('Error seeding badges:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

seedBadges();
