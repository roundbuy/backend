/**
 * Seed Dummy Support Tickets and Disputes
 * Run this script to add test data for Support & Resolution screen
 */

const db = require('../config/database');

async function seedSupportTickets() {
    console.log('🎫 Creating dummy support tickets...');

    const tickets = [
        {
            user_id: 1, // Update with actual user ID
            ticket_number: 'TKT-2024-001',
            category: 'deleted_ads',
            subject: 'My ad was deleted',
            description: 'My coffee maker ad was removed. I believe this was a mistake.',
            status: 'open',
            priority: 'high',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            user_id: 1,
            ticket_number: 'TKT-2024-002',
            category: 'technical',
            subject: 'App crashes when uploading images',
            description: 'The app crashes every time I try to upload more than 3 images.',
            status: 'in_progress',
            priority: 'medium',
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        },
        {
            user_id: 1,
            ticket_number: 'TKT-2024-003',
            category: 'billing',
            subject: 'Payment not processed',
            description: 'I tried to upgrade to Violet membership but payment failed.',
            status: 'awaiting_user',
            priority: 'high',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
            user_id: 1,
            ticket_number: 'TKT-2024-004',
            category: 'account',
            subject: 'Cannot change email address',
            description: 'I want to update my email but the form shows an error.',
            status: 'resolved',
            priority: 'low',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
    ];

    for (const ticket of tickets) {
        try {
            const result = await db.query(
                `INSERT INTO support_tickets 
        (user_id, ticket_number, category, subject, description, status, priority, created_at, resolved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id`,
                [
                    ticket.user_id,
                    ticket.ticket_number,
                    ticket.category,
                    ticket.subject,
                    ticket.description,
                    ticket.status,
                    ticket.priority,
                    ticket.created_at,
                    ticket.resolved_at || null,
                ]
            );
            console.log(`✅ Created ticket: ${ticket.ticket_number} (ID: ${result.rows[0].id})`);
        } catch (error) {
            console.error(`❌ Error creating ticket ${ticket.ticket_number}:`, error.message);
        }
    }
}

async function seedDeletedAds() {
    console.log('🗑️  Creating dummy deleted ads...');

    const deletedAds = [
        {
            user_id: 1,
            advertisement_id: 101, // Update with actual ad ID or null
            title: 'Sexy woman coffee maker',
            description: 'Coffee maker with inappropriate image',
            deletion_reason: 'policy_violation',
            deletion_details: 'Your ad has been removed as having Forbidden content (text or images). Please try again.',
            can_appeal: true,
            appeal_status: 'not_appealed',
            appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            deleted_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            user_id: 1,
            advertisement_id: 102,
            title: 'Sexy Armchair',
            description: 'Armchair with inappropriate title',
            deletion_reason: 'policy_violation',
            deletion_details: 'Your ad has been removed as having Forbidden content (text or images). Please try again.',
            can_appeal: true,
            appeal_status: 'not_appealed',
            appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deleted_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
            user_id: 1,
            advertisement_id: 103,
            title: 'Armchair "for Sexy People"',
            description: 'Armchair with inappropriate description',
            deletion_reason: 'policy_violation',
            deletion_details: 'Your ad has been removed as having Forbidden content (text or images). Please try again.',
            can_appeal: true,
            appeal_status: 'not_appealed',
            appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deleted_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        {
            user_id: 1,
            advertisement_id: 104,
            title: 'Coffee maker "with sexy woman pic"',
            description: 'Coffee maker with inappropriate image',
            deletion_reason: 'policy_violation',
            deletion_details: 'Your ad has been removed as having Forbidden content (text or images). Please try again.',
            can_appeal: true,
            appeal_status: 'not_appealed',
            appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deleted_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
    ];

    for (const ad of deletedAds) {
        try {
            const result = await db.query(
                `INSERT INTO deleted_advertisements 
        (user_id, advertisement_id, title, description, deletion_reason, deletion_details, 
         can_appeal, appeal_status, appeal_deadline, deleted_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id`,
                [
                    ad.user_id,
                    ad.advertisement_id,
                    ad.title,
                    ad.description,
                    ad.deletion_reason,
                    ad.deletion_details,
                    ad.can_appeal,
                    ad.appeal_status,
                    ad.appeal_deadline,
                    ad.deleted_at,
                ]
            );
            console.log(`✅ Created deleted ad: ${ad.title} (ID: ${result.rows[0].id})`);
        } catch (error) {
            console.error(`❌ Error creating deleted ad ${ad.title}:`, error.message);
        }
    }
}

async function seedDisputes() {
    console.log('⚖️  Creating dummy disputes...');

    const disputes = [
        {
            user_id: 1,
            advertisement_id: 201, // Update with actual ad ID
            dispute_number: 'DSP-2024-001',
            type: 'exchange',
            category: 'item_not_received',
            title: 'Pick & Exchange: Arm chair',
            description: 'You have confirmed your Exchange with Robbie3. Make sure both parties has received what agreed.',
            status: 'pending',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            user_id: 1,
            advertisement_id: 202,
            dispute_number: 'DSP-2024-002',
            type: 'exchange',
            category: 'item_not_as_described',
            title: 'Pick Up & Exchange: Coffee maker',
            description: 'You have confirmed your Exchange with RBtester. Make sure both parties has received what agreed.',
            status: 'under_review',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
            user_id: 1,
            advertisement_id: 203,
            dispute_number: 'DSP-2024-003',
            type: 'exchange',
            category: 'item_not_received',
            title: 'Pick Up & Exchange: Aston Martini',
            description: 'You have confirmed your Exchange with DougHot. Make sure both parties has received what agreed.',
            status: 'negotiation',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        {
            user_id: 1,
            advertisement_id: 204,
            dispute_number: 'DSP-2024-004',
            type: 'exchange',
            category: 'item_not_received',
            title: 'Pick Up & Exchange: Soccer ball',
            description: 'You have confirmed your Exchange with HarryS. Make sure both parties has received what agreed.',
            status: 'resolved',
            resolution_status: 'completed',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
    ];

    for (const dispute of disputes) {
        try {
            const result = await db.query(
                `INSERT INTO disputes 
        (user_id, advertisement_id, dispute_number, type, category, title, description, 
         status, resolution_status, created_at, resolved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id`,
                [
                    dispute.user_id,
                    dispute.advertisement_id,
                    dispute.dispute_number,
                    dispute.type,
                    dispute.category,
                    dispute.title,
                    dispute.description,
                    dispute.status,
                    dispute.resolution_status || null,
                    dispute.created_at,
                    dispute.resolved_at || null,
                ]
            );
            console.log(`✅ Created dispute: ${dispute.title} (ID: ${result.rows[0].id})`);
        } catch (error) {
            console.error(`❌ Error creating dispute ${dispute.title}:`, error.message);
        }
    }
}

async function seedExchanges() {
    console.log('🔄 Creating dummy exchanges...');

    const exchanges = [
        {
            user_id: 1,
            advertisement_id: 301,
            other_user_id: 2,
            title: 'Pick & Exchange: Arm chair',
            description: 'Exchange confirmed with Robbie3',
            status: 'confirmed',
            exchange_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
            user_id: 1,
            advertisement_id: 302,
            other_user_id: 3,
            title: 'Pick Up & Exchange: Coffee maker',
            description: 'Exchange confirmed with RBtester',
            status: 'confirmed',
            exchange_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
    ];

    for (const exchange of exchanges) {
        try {
            const result = await db.query(
                `INSERT INTO exchanges 
        (user_id, advertisement_id, other_user_id, title, description, status, exchange_date, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`,
                [
                    exchange.user_id,
                    exchange.advertisement_id,
                    exchange.other_user_id,
                    exchange.title,
                    exchange.description,
                    exchange.status,
                    exchange.exchange_date,
                    exchange.created_at,
                ]
            );
            console.log(`✅ Created exchange: ${exchange.title} (ID: ${result.rows[0].id})`);
        } catch (error) {
            console.error(`❌ Error creating exchange ${exchange.title}:`, error.message);
        }
    }
}

async function main() {
    console.log('🌱 Starting to seed dummy data...\n');

    try {
        await seedSupportTickets();
        console.log('');

        await seedDeletedAds();
        console.log('');

        await seedDisputes();
        console.log('');

        await seedExchanges();
        console.log('');

        console.log('✅ All dummy data created successfully!');
        console.log('\n📝 Note: Update user_id and advertisement_id values as needed.');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        process.exit(0);
    }
}

// Run the script
main();
