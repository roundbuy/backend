require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { promisePool } = require('../../src/config/database');

async function seed() {
    console.log('🌱 Starting Social Clubs & Events seeding...');
    try {
        // ── 1. Fetch a valid admin/user ID ─────────────────────────────────────
        const [users] = await promisePool.query('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
            throw new Error('No users found in database. Please create a user first.');
        }
        const userId = users[0].id;
        console.log(`👤 Using User ID: ${userId}`);

        // ── 2. Clear previously seeded events ─────────────────────────────────
        await promisePool.query("DELETE FROM events WHERE title LIKE 'SEED:%'");
        console.log('🧹 Cleared previously seeded events.');

        // ── 3. Define events ───────────────────────────────────────────────────
        const now = new Date();
        const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
        const addHours = (d, h) => { const x = new Date(d); x.setHours(x.getHours() + h); return x; };
        const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

        const events = [
            // ── LIVE EVENTS ─────────────────────────────────────────────────────
            {
                title: 'SEED: Live Vintage Market Auction',
                heading: '🛍️ Live Vintage Treasures — Bid & Win!',
                description: 'Join our live vintage market room where sellers showcase rare finds from the 80s & 90s. Bid in real-time on leather jackets, designer bags, vinyl records, and curated retro pieces. A marketplace experience like no other!',
                thumbnail_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Vintage',
                status: 'live',
                start_time: fmt(addHours(now, -1)),
                end_time: fmt(addHours(now, 8)),   // 8h window so it stays live
                max_participants: 80,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 34,
                follower_count: 92,
                live_participant_count: 18,
                occurrence_day_1: 'Saturday',
            },
            {
                title: 'SEED: Fashion Forward Live Showcase',
                heading: '👗 Fashion Forward — Live Styling Session',
                description: 'A curated live room where independent fashion designers and boutique sellers display their latest collections. Ask questions, make offers, and discover unique pieces you won\'t find anywhere else. Limited slots available!',
                thumbnail_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Fashion',
                status: 'live',
                start_time: fmt(addHours(now, -2)),
                end_time: fmt(addHours(now, 8)),   // 8h window so it stays live
                max_participants: 50,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 27,
                follower_count: 65,
                live_participant_count: 12,
                occurrence_day_1: 'Sunday',
            },

            // ── UPCOMING EVENTS ─────────────────────────────────────────────────
            {
                title: 'SEED: Tech & Gadgets Flash Sale',
                heading: '⚡ Tech Flash Sale — Deals Every Hour',
                description: 'Pre-loved smartphones, laptops, smart home devices, and gaming gear up for grabs. Sellers will offer flash deals every 30 minutes. Subscribe to get notified when we go live — deals disappear fast!',
                thumbnail_url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Tech',
                status: 'upcoming',
                start_time: fmt(addDays(now, 2)),
                end_time: fmt(addHours(addDays(now, 2), 3)),
                max_participants: 120,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 89,
                follower_count: 210,
                live_participant_count: 0,
                occurrence_day_1: 'Wednesday',
            },
            {
                title: 'SEED: Home & Garden Treasure Hunt',
                heading: '🌿 Home & Garden Bazaar — Find Your Gem',
                description: 'From artisan ceramics and handcrafted furniture to plant collections and garden art, this event brings the best of home décor to your screen. Chat with sellers, make offers, and upgrade your living space from anywhere.',
                thumbnail_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Home & Garden',
                status: 'upcoming',
                start_time: fmt(addDays(now, 4)),
                end_time: fmt(addHours(addDays(now, 4), 2)),
                max_participants: 60,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 43,
                follower_count: 118,
                live_participant_count: 0,
                occurrence_day_1: 'Friday',
            },
            {
                title: 'SEED: Kids & Baby Swap Shop',
                heading: '🍼 Kids & Baby Swap — Sustainable Parenting',
                description: 'A community-driven live swap shop for parents to buy and sell quality pre-loved children\'s clothing, toys, and equipment. All items reviewed for safety. A great way to save money and reduce waste.',
                thumbnail_url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Kids',
                status: 'upcoming',
                start_time: fmt(addDays(now, 6)),
                end_time: fmt(addHours(addDays(now, 6), 2)),
                max_participants: null,
                allow_bidding: 0,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 65,
                follower_count: 143,
                live_participant_count: 0,
                occurrence_day_1: 'Sunday',
            },
            {
                title: 'SEED: Sneaker & Streetwear Drop',
                heading: '👟 Sneaker Drop — Exclusive Streetwear',
                description: 'Rare deadstock sneakers, limited collabs, and premium streetwear pieces. Sellers verify all items before listing. This is the go-to event for sneakerheads and hype culture fans. First come, first served on the hottest drops!',
                thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Sneakers',
                status: 'upcoming',
                start_time: fmt(addDays(now, 5)),
                end_time: fmt(addHours(addDays(now, 5), 3)),
                max_participants: 100,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 152,
                follower_count: 380,
                live_participant_count: 0,
                occurrence_day_1: 'Thursday',
            },
            {
                title: 'SEED: Premium Jewellery & Watches Showcase',
                heading: '💎 Jewellery & Timepieces — Luxury for Less',
                description: 'A curated showcase of fine jewellery, pre-owned luxury watches, and handcrafted accessories. Perfect for gifts or personal style upgrades. All pieces described with condition ratings and verified by community members.',
                thumbnail_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Jewellery',
                status: 'upcoming',
                start_time: fmt(addDays(now, 8)),
                end_time: fmt(addHours(addDays(now, 8), 2)),
                max_participants: 40,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 2.00,
                subscriber_count: 71,
                follower_count: 189,
                live_participant_count: 0,
                occurrence_day_1: 'Saturday',
            },
            {
                title: 'SEED: Book Club & Collectors Exchange',
                heading: '📚 Book Lovers\' Exchange — Rare & Pre-loved',
                description: 'Whether you\'re a casual reader or serious collector, this event brings rare first editions, signed copies, academic texts, and beloved fiction to a live swapping event. List your books, chat with fellow readers, and give stories a new life.',
                thumbnail_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Books',
                status: 'upcoming',
                start_time: fmt(addDays(now, 10)),
                end_time: fmt(addHours(addDays(now, 10), 2)),
                max_participants: null,
                allow_bidding: 0,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 31,
                follower_count: 84,
                live_participant_count: 0,
                occurrence_day_1: 'Monday',
            },

            // ── FINISHED EVENTS ─────────────────────────────────────────────────
            {
                title: 'SEED: Weekend Sports Gear Clearance',
                heading: '🏃 Sports Gear Clearance — Week 1',
                description: 'Cycling, running, gym, and outdoor sports equipment. Pre-loved but fully functional. Great deals were had by all — check out our upcoming events for the next round!',
                thumbnail_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Sports',
                status: 'finished',
                start_time: fmt(addDays(now, -5)),
                end_time: fmt(addHours(addDays(now, -5), 2)),
                max_participants: 60,
                allow_bidding: 1,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 55,
                follower_count: 102,
                live_participant_count: 38,
                occurrence_day_1: 'Saturday',
            },
            {
                title: 'SEED: Tupperware & Kitchen Essentials',
                heading: '🍳 Tupperware & Kitchen — Community Sale',
                description: 'Our first themed kitchen essentials event was a roaring success! From Tupperware sets to KitchenAid mixers, the community came together for brilliant deals. Next event coming soon!',
                thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
                cover_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
                category_tag: 'Tupperware',
                status: 'finished',
                start_time: fmt(addDays(now, -8)),
                end_time: fmt(addHours(addDays(now, -8), 2)),
                max_participants: null,
                allow_bidding: 0,
                chat_enabled: 1,
                entry_fee: 0.00,
                subscriber_count: 48,
                follower_count: 97,
                live_participant_count: 42,
                occurrence_day_1: 'Tuesday',
            },
        ];

        // ── 4. Insert events ───────────────────────────────────────────────────
        let inserted = 0;
        for (const ev of events) {
            const [result] = await promisePool.query(`
                INSERT INTO events (
                    title, heading, description,
                    thumbnail_url, cover_url,
                    category_tag, status,
                    start_time, end_time,
                    max_participants, allow_bidding, chat_enabled,
                    entry_fee, subscriber_count, follower_count,
                    live_participant_count, occurrence_day_1,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                ev.title, ev.heading, ev.description,
                ev.thumbnail_url, ev.cover_url,
                ev.category_tag, ev.status,
                ev.start_time, ev.end_time,
                ev.max_participants, ev.allow_bidding, ev.chat_enabled,
                ev.entry_fee, ev.subscriber_count, ev.follower_count,
                ev.live_participant_count, ev.occurrence_day_1,
                userId
            ]);
            console.log(`✨ [${ev.status.toUpperCase()}] Seeded: "${ev.title}" (ID: ${result.insertId})`);
            inserted++;
        }

        console.log(`\n🎉 Done! Seeded ${inserted} social club events successfully.`);
        console.log('   - 2 LIVE events');
        console.log('   - 6 UPCOMING events');
        console.log('   - 2 FINISHED events');

    } catch (error) {
        console.error('❌ Error seeding events:', error);
    } finally {
        process.exit(0);
    }
}

seed();
