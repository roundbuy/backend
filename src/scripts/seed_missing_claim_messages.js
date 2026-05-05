const { promisePool } = require('../config/database');

async function seedMissingClaimMessages() {
  console.log('🚀 Starting to seed missing claim status updates...');
  
  try {
    // 1. Find claims that don't have a system message in claim_messages
    const [claims] = await promisePool.query(`
      SELECT c.id, c.user_id, c.claim_number, c.created_at 
      FROM claims c
      LEFT JOIN claim_messages cm ON c.id = cm.claim_id AND cm.is_system_message = TRUE
      WHERE cm.id IS NULL
    `);

    console.log(`🔍 Found ${claims.length} claims needing status updates.`);

    for (const claim of claims) {
      console.log(`📦 Processing Claim: ${claim.claim_number} (ID: ${claim.id})`);

      const connection = await promisePool.getConnection();
      try {
        await connection.beginTransaction();

        // 2. Add initial system message
        await connection.query(
          `INSERT INTO claim_messages (claim_id, user_id, message, is_system_message, message_type, created_at)
           VALUES (?, ?, ?, TRUE, 'status_update', ?)`,
          [
            claim.id, 
            claim.user_id, 
            `Claim ${claim.claim_number} created. Awaiting admin review.`,
            claim.created_at
          ]
        );

        await connection.commit();
        console.log(`✅ Successfully seeded status update for Claim ${claim.claim_number}`);

      } catch (err) {
        await connection.rollback();
        console.error(`❌ Failed to process Claim ${claim.id}:`, err.message);
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

seedMissingClaimMessages();
