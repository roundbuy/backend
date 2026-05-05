const { promisePool } = require('../config/database');

async function seedMissingDisputeMessages() {
  console.log('🚀 Starting to seed missing dispute status updates...');
  
  try {
    // 1. Find disputes that don't have a system message in dispute_messages
    const [disputes] = await promisePool.query(`
      SELECT d.id, d.user_id, d.dispute_number, d.created_at 
      FROM disputes d
      LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id AND dm.is_system_message = TRUE
      WHERE dm.id IS NULL
    `);

    console.log(`🔍 Found ${disputes.length} disputes needing status updates.`);

    for (const dispute of disputes) {
      console.log(`📦 Processing Dispute: ${dispute.dispute_number} (ID: ${dispute.id})`);

      const connection = await promisePool.getConnection();
      try {
        await connection.beginTransaction();

        // 2. Add initial system message
        await connection.query(
          `INSERT INTO dispute_messages (dispute_id, user_id, message, is_system_message, message_type, created_at)
           VALUES (?, ?, ?, TRUE, 'status_update', ?)`,
          [
            dispute.id, 
            dispute.user_id, 
            'Dispute created. Our team will review your case within 24-48 hours.',
            dispute.created_at
          ]
        );

        await connection.commit();
        console.log(`✅ Successfully seeded status update for Dispute ${dispute.dispute_number}`);

      } catch (err) {
        await connection.rollback();
        console.error(`❌ Failed to process Dispute ${dispute.id}:`, err.message);
      } finally {
        connection.release();
      }
    }

    console.log('✨ Seeding process completed.');
    process.exit(0);
  } catch (error) {
    console.error('💥 Critical error during seeding:', error);
    process.exit(1);
  }
}

seedMissingDisputeMessages();
