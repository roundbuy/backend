require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function createTestIssues() {
    try {
        console.log('🚀 Creating test issues and data...\n');

        // Get some users and ads from the database
        const [users] = await promisePool.query('SELECT id, email, full_name FROM users LIMIT 5');
        const [ads] = await promisePool.query('SELECT id, title, user_id FROM advertisements LIMIT 5');

        if (users.length < 2) {
            console.log('❌ Need at least 2 users in the database');
            return;
        }

        if (ads.length < 1) {
            console.log('❌ Need at least 1 advertisement in the database');
            return;
        }

        console.log(`Found ${users.length} users and ${ads.length} ads\n`);

        // Test Issue 1: Pending issue (Quality)
        console.log('Creating Test Issue 1: Quality Issue (Pending)...');
        const issue1Deadline = new Date();
        issue1Deadline.setDate(issue1Deadline.getDate() + 3);
        issue1Deadline.setHours(0, 0, 0, 0);

        const [issue1] = await promisePool.query(
            `INSERT INTO issues (
        issue_number, created_by, other_party_id, advertisement_id,
        issue_type, issue_description, status, issue_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'ISS00000001',
                users[0].id,
                users[1].id,
                ads[0].id,
                'quality',
                'The item I received has several quality issues. The product description mentioned it was in excellent condition, but there are visible scratches and the functionality is not as described.',
                'pending',
                issue1Deadline
            ]
        );

        // Add system message
        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
            [
                issue1.insertId,
                users[0].id,
                `Issue created. The other party has 3 days to respond (deadline: ${issue1Deadline.toISOString().split('T')[0]}).`
            ]
        );

        // Add user message
        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, FALSE)`,
            [
                issue1.insertId,
                users[0].id,
                'I would like to discuss a possible return or exchange. Please let me know your thoughts.'
            ]
        );

        console.log(`✅ Created issue ISS00000001 (ID: ${issue1.insertId})\n`);

        // Test Issue 2: Pending issue (Delivery)
        console.log('Creating Test Issue 2: Delivery Issue (Pending)...');
        const issue2Deadline = new Date();
        issue2Deadline.setDate(issue2Deadline.getDate() + 2);
        issue2Deadline.setHours(0, 0, 0, 0);

        const [issue2] = await promisePool.query(
            `INSERT INTO issues (
        issue_number, created_by, other_party_id, advertisement_id,
        issue_type, issue_description, status, issue_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'ISS00000002',
                users[1].id,
                users[0].id,
                ads[1] ? ads[1].id : ads[0].id,
                'delivery',
                'The item was supposed to be delivered within 3 days but it has been over a week and I still have not received it. Can you please provide tracking information?',
                'pending',
                issue2Deadline
            ]
        );

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
            [
                issue2.insertId,
                users[1].id,
                `Issue created. The other party has 2 days to respond (deadline: ${issue2Deadline.toISOString().split('T')[0]}).`
            ]
        );

        console.log(`✅ Created issue ISS00000002 (ID: ${issue2.insertId})\n`);

        // Test Issue 3: Accepted issue
        console.log('Creating Test Issue 3: Accepted Issue...');
        const issue3Deadline = new Date();
        issue3Deadline.setDate(issue3Deadline.getDate() + 3);

        const [issue3] = await promisePool.query(
            `INSERT INTO issues (
        issue_number, created_by, other_party_id, advertisement_id,
        issue_type, issue_description, status, issue_deadline, accepted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                'ISS00000003',
                users[0].id,
                users[1].id,
                ads[2] ? ads[2].id : ads[0].id,
                'price',
                'There was a pricing error in the listing. We agreed on a different price during our conversation.',
                'accepted',
                issue3Deadline
            ]
        );

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
            [issue3.insertId, users[0].id, 'Issue created.']
        );

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
            [issue3.insertId, users[1].id, 'Issue accepted. Case resolved.']
        );

        console.log(`✅ Created issue ISS00000003 (ID: ${issue3.insertId})\n`);

        // Test Issue 4: Rejected/Escalated issue with dispute
        console.log('Creating Test Issue 4: Rejected Issue with Dispute...');
        const issue4Deadline = new Date();
        issue4Deadline.setDate(issue4Deadline.getDate() + 3);

        const [issue4] = await promisePool.query(
            `INSERT INTO issues (
        issue_number, created_by, other_party_id, advertisement_id,
        issue_type, issue_description, status, issue_deadline, rejected_at, escalated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                'ISS00000004',
                users[1].id,
                users[0].id,
                ads[3] ? ads[3].id : ads[0].id,
                'description_mismatch',
                'The item description does not match what was delivered. The specifications are completely different.',
                'escalated',
                issue4Deadline
            ]
        );

        // Create corresponding dispute
        const disputeDeadline = new Date();
        disputeDeadline.setDate(disputeDeadline.getDate() + 20);

        const [dispute] = await promisePool.query(
            `INSERT INTO disputes (
        dispute_number, user_id, type, advertisement_id, issue_id,
        dispute_type, dispute_category, problem_description,
        status, current_phase, priority, dispute_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'DIS00000001',
                'issue_escalation',
                users[1].id,
                ads[3] ? ads[3].id : ads[0].id,
                issue4.insertId,
                'issue_negotiation',
                'description_mismatch',
                'The item description does not match what was delivered. The specifications are completely different.',
                'pending',
                'dispute',
                'medium',
                disputeDeadline
            ]
        );

        // Update issue with dispute ID
        await promisePool.query(
            'UPDATE issues SET escalated_dispute_id = ? WHERE id = ?',
            [dispute.insertId, issue4.insertId]
        );

        await promisePool.query(
            `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
      VALUES (?, ?, ?, TRUE)`,
            [issue4.insertId, users[1].id, 'Issue rejected. Escalating to dispute...']
        );

        await promisePool.query(
            `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type)
      VALUES (?, ?, ?, TRUE, 'status_update')`,
            [
                dispute.insertId,
                users[1].id,
                `Dispute created from rejected issue ISS00000004. Both parties have 20 days to provide evidence and responses.`
            ]
        );

        console.log(`✅ Created issue ISS00000004 (ID: ${issue4.insertId})`);
        console.log(`✅ Created dispute DIS00000001 (ID: ${dispute.insertId})\n`);

        // Test Issue 5: Exchange issue
        if (users.length >= 3 && ads.length >= 4) {
            console.log('Creating Test Issue 5: Exchange Issue...');
            const issue5Deadline = new Date();
            issue5Deadline.setDate(issue5Deadline.getDate() + 3);

            const [issue5] = await promisePool.query(
                `INSERT INTO issues (
          issue_number, created_by, other_party_id, advertisement_id,
          issue_type, issue_description, status, issue_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'ISS00000005',
                    users[2].id,
                    users[0].id,
                    ads[4] ? ads[4].id : ads[0].id,
                    'exchange',
                    'I would like to exchange this item for a different size/color. Is that possible?',
                    'pending',
                    issue5Deadline
                ]
            );

            await promisePool.query(
                `INSERT INTO issue_messages (issue_id, user_id, message, is_system_message)
        VALUES (?, ?, ?, TRUE)`,
                [issue5.insertId, users[2].id, 'Issue created.']
            );

            console.log(`✅ Created issue ISS00000005 (ID: ${issue5.insertId})\n`);
        }

        // Summary
        console.log('📊 Test Data Summary:');
        const [issueCount] = await promisePool.query('SELECT COUNT(*) as count FROM issues');
        const [disputeCount] = await promisePool.query('SELECT COUNT(*) as count FROM disputes');
        const [messageCount] = await promisePool.query('SELECT COUNT(*) as count FROM issue_messages');

        console.log(`   ✅ Total Issues: ${issueCount[0].count}`);
        console.log(`   ✅ Total Disputes: ${disputeCount[0].count}`);
        console.log(`   ✅ Total Issue Messages: ${messageCount[0].count}`);

        console.log('\n✨ Test data created successfully!\n');

        // Display test users
        console.log('👥 Test Users:');
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.full_name || user.email} (ID: ${user.id})`);
        });

        console.log('\n📱 You can now test with these user IDs in the mobile app!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test data:', error);
        process.exit(1);
    }
}

createTestIssues();
