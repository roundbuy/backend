/**
 * Seed real-world sample data for:
 * 1. Donator Users & Charity Listings (25%, 50%, 75%, 100% donations)
 * 2. EasyReturn sample offers, conversations, and orders
 * 3. Charity donations ledger entries
 */

const { promisePool } = require('../src/config/database');

async function seedEasyReturnAndDonations() {
  console.log('🌱 Starting EasyReturn and Donations Data Seeding...');

  try {
    // 1. Mark Oliver Taylor, Emma Watson, Alexandre Dubois as active Donators
    await promisePool.query(`
      UPDATE users 
      SET is_donator = 1, show_donator_status = 1 
      WHERE email IN ('oliver.taylor@roundbuy.co.uk', 'emma.watson@roundbuy.co.uk', 'alexandre.dubois@roundbuy.fr')
    `);
    console.log('✅ Updated users: oliver.taylor, emma.watson, alexandre.dubois with is_donator = 1');

    // 2. Add donation percentages to selected advertisements
    const [ads] = await promisePool.query('SELECT id, user_id, title, price FROM advertisements ORDER BY id ASC LIMIT 8');
    
    if (ads.length >= 4) {
      // Ad 1: 50% charity donation
      await promisePool.query('UPDATE advertisements SET donation_percent = 50.00, is_charity_listing = 1 WHERE id = ?', [ads[0].id]);
      // Ad 2: 100% charity donation (full charity sale)
      await promisePool.query('UPDATE advertisements SET donation_percent = 100.00, is_charity_listing = 1 WHERE id = ?', [ads[1].id]);
      // Ad 3: 25% charity donation
      await promisePool.query('UPDATE advertisements SET donation_percent = 25.00, is_charity_listing = 1 WHERE id = ?', [ads[2].id]);
      // Ad 4: 75% charity donation
      await promisePool.query('UPDATE advertisements SET donation_percent = 75.00, is_charity_listing = 1 WHERE id = ?', [ads[3].id]);

      console.log(`✅ Configured Charity Listings on Ads: #${ads[0].id} (50%), #${ads[1].id} (100%), #${ads[2].id} (25%), #${ads[3].id} (75%)`);

      // 3. Seed charity_donations ledger records
      await promisePool.query(`
        INSERT INTO charity_donations 
        (order_id, advertisement_id, seller_id, buyer_id, total_item_price, donation_percent, donation_amount, platform_fee, status, created_at)
        VALUES 
        (NULL, ?, ?, 145, ?, 50.00, ?, 1.00, 'completed', NOW() - INTERVAL 3 DAY),
        (NULL, ?, ?, 146, ?, 100.00, ?, 1.00, 'completed', NOW() - INTERVAL 1 DAY)
      `, [
        ads[0].id, ads[0].user_id, parseFloat(ads[0].price), parseFloat(ads[0].price) * 0.5,
        ads[1].id, ads[1].user_id, parseFloat(ads[1].price), parseFloat(ads[1].price) * 1.0
      ]);
      console.log('✅ Created charity_donations records');
    }

    // 4. Seed an EasyReturn Offer & Conversation for testing
    const [buyerUsers] = await promisePool.query('SELECT id FROM users WHERE email = ?', ['charlotte.davies@roundbuy.co.uk']);
    const buyerId = buyerUsers[0]?.id || 145;
    const sampleAd = ads[0] || { id: 269, user_id: 144, price: 2450 };

    // Check or create conversation
    const [existingConv] = await promisePool.query(
      'SELECT id FROM conversations WHERE advertisement_id = ? AND buyer_id = ? LIMIT 1',
      [sampleAd.id, buyerId]
    );

    let convId;
    if (existingConv.length > 0) {
      convId = existingConv[0].id;
    } else {
      const [newConv] = await promisePool.query(
        'INSERT INTO conversations (advertisement_id, buyer_id, seller_id, created_at) VALUES (?, ?, ?, NOW())',
        [sampleAd.id, buyerId, sampleAd.user_id]
      );
      convId = newConv.insertId;
    }

    // Insert sample EasyReturn offer
    await promisePool.query(`
      INSERT INTO offers (conversation_id, advertisement_id, buyer_id, seller_id, sender_id, offered_price, easy_return_agreed, easy_return_split_percent, status, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 50, 'accepted', 'Offer with EasyReturn 50/50 Coverage', NOW() - INTERVAL 2 HOUR)
    `, [convId, sampleAd.id, buyerId, sampleAd.user_id, buyerId, parseFloat(sampleAd.price) * 0.9]);

    console.log(`✅ Seeded EasyReturn offer in conversation #${convId} for Ad #${sampleAd.id}`);

    console.log('🎉 EasyReturn and Donations Data Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedEasyReturnAndDonations();
