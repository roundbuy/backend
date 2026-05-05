const { promisePool } = require('../config/database');

async function seedMissingIssues() {
  console.log('🚀 Starting to seed missing issues for disputes...');
  
  const VALID_ISSUE_TYPES = ['quality', 'delivery', 'description_mismatch', 'price', 'exchange', 'other'];

  const mapIssueType = (category) => {
    if (!category) return 'other';
    const cat = category.toLowerCase().trim().replace(/ /g, '_');
    if (VALID_ISSUE_TYPES.includes(cat)) return cat;
    if (cat === 'damaged' || cat === 'defective') return 'quality';
    if (cat === 'not_as_described') return 'description_mismatch';
    if (cat === 'shipping') return 'delivery';
    return 'other';
  };

  try {
    // 1. Find disputes without escalated_from_issue_id
    const [disputes] = await promisePool.query(`
      SELECT d.*, a.title as ad_title 
      FROM disputes d
      LEFT JOIN advertisements a ON d.advertisement_id = a.id
      WHERE d.escalated_from_issue_id IS NULL OR d.escalated_from_issue_id = 0
    `);

    console.log(`🔍 Found ${disputes.length} disputes needing issues.`);

    for (const dispute of disputes) {
      console.log(`📦 Processing Dispute: ${dispute.dispute_number} (ID: ${dispute.id})`);

      const connection = await promisePool.getConnection();
      try {
        await connection.beginTransaction();

        // 2. Generate Issue Number
        const [rows] = await connection.query(
          'SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number, 4) AS UNSIGNED)), 0) + 1 as next_num FROM issues'
        );
        const nextNum = rows[0].next_num;
        const issueNumber = `ISS${String(nextNum).padStart(8, '0')}`;

        // 3. Create Issue
        const issueType = mapIssueType(dispute.dispute_category);
        console.log(`   - Mapping category "${dispute.dispute_category}" to issue_type "${issueType}"`);

        const [issueResult] = await connection.query(
          `INSERT INTO issues (
            issue_number, advertisement_id, product_name, 
            created_by, other_party_id, issue_type, 
            issue_description, status, deadline, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'escalated_to_dispute', ?, ?, ?)`,
          [
            issueNumber,
            dispute.advertisement_id,
            dispute.ad_title || 'Product',
            dispute.user_id,
            dispute.seller_id || 0,
            issueType,
            dispute.problem_description || 'Auto-generated from dispute',
            dispute.created_at, 
            dispute.created_at,
            dispute.created_at
          ]
        );

        const issueId = issueResult.insertId;

        // 4. Update Dispute with the new Issue ID
        await connection.query(
          'UPDATE disputes SET escalated_from_issue_id = ? WHERE id = ?',
          [issueId, dispute.id]
        );

        // 5. Add initial system message to issue_messages
        await connection.query(
          `INSERT INTO issue_messages (issue_id, sender_id, message, is_system_message, created_at)
           VALUES (?, ?, ?, TRUE, ?)`,
          [
            issueId,
            dispute.user_id,
            `Issue ${issueNumber} created (Retro-seeded). Escalated to dispute ${dispute.dispute_number}.`,
            dispute.created_at
          ]
        );

        await connection.commit();
        console.log(`✅ Successfully seeded Issue ${issueNumber} for Dispute ${dispute.dispute_number}`);

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

seedMissingIssues();
