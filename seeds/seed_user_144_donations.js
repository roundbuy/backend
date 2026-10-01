/**
 * Seed comprehensive donation and charity data for User ID 144 (Oliver Taylor)
 */

const { promisePool } = require('../src/config/database');

async function seedUser144Donations() {
  console.log('🌱 Seeding Donations & Charity Data for User ID 144 (Oliver Taylor)...');

  try {
    const userId = 144;

    // 1. Verify and update User 144 as a verified Donator
    await promisePool.query(`
      UPDATE users 
      SET is_donator = 1, show_donator_status = 1 
      WHERE id = ?
    `, [userId]);
    console.log('✅ User 144 marked as active Donator with public badge enabled.');

    // 2. Fetch User 144's advertisements
    const [ads] = await promisePool.query(
      'SELECT id, title, price FROM advertisements WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );

    if (ads.length === 0) {
      console.warn('⚠️ No advertisements found for User 144. Creating sample ad...');
      const [insertAd] = await promisePool.query(`
        INSERT INTO advertisements (user_id, title, description, price, category_id, status, is_charity_listing, donation_percent, created_at)
        VALUES (?, 'MacBook Pro 16" M3 Max', 'Charity listing supporting education programs.', 2450.00, 1, 'published', 1, 50.00, NOW())
      `, [userId]);
      ads.push({ id: insertAd.insertId, title: 'MacBook Pro 16" M3 Max', price: 2450.00 });
    }

    // Configure distinct donation tiers across User 144's listings:
    // Ad 1: 50% Charity Donation
    // Ad 2: 100% Full Charity Sale
    // Ad 3: 25% Charity Donation
    // Ad 4: 75% Charity Donation
    // Ad 5: 10% Charity Donation
    const donationTiers = [50.00, 100.00, 25.00, 75.00, 10.00];

    for (let i = 0; i < ads.length && i < donationTiers.length; i++) {
      const tier = donationTiers[i];
      await promisePool.query(`
        UPDATE advertisements 
        SET donation_percent = ?, is_charity_listing = 1 
        WHERE id = ?
      `, [tier, ads[i].id]);
      console.log(`✅ Ad #${ads[i].id} ("${ads[i].title}", £${ads[i].price}) -> ${tier}% Charity Donation Tier`);
    }

    // 3. Clear previous seed charity donations for User 144 to prevent duplicates
    await promisePool.query('DELETE FROM charity_donations WHERE seller_id = ?', [userId]);

    // 4. Seed completed orders and charity_donations ledger records
    const buyerId = 145; // Charlotte Davies

    for (let i = 0; i < Math.min(3, ads.length); i++) {
      const ad = ads[i];
      const tier = donationTiers[i];
      const price = parseFloat(ad.price);
      const donationAmount = parseFloat(((price * tier) / 100).toFixed(2));
      const platformFee = 1.00;

      // Insert completed order
      const [orderResult] = await promisePool.query(`
        INSERT INTO orders (
          buyer_id, seller_id, advertisement_id, amount, status, 
          payment_status, payment_method, easy_return_enabled, 
          donation_percent, donation_amount, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, 'completed',
          'completed', 'card', 1,
          ?, ?, NOW() - INTERVAL ? DAY, NOW() - INTERVAL ? DAY
        )
      `, [buyerId, userId, ad.id, price, tier, donationAmount, (i + 1) * 2, (i + 1) * 2]);

      const orderId = orderResult.insertId;

      // Insert charity_donations ledger record
      await promisePool.query(`
        INSERT INTO charity_donations (
          order_id, advertisement_id, seller_id, buyer_id, 
          total_item_price, donation_percent, donation_amount, 
          platform_fee, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, 'completed', NOW() - INTERVAL ? DAY, NOW() - INTERVAL ? DAY
        )
      `, [orderId, ad.id, userId, buyerId, price, tier, donationAmount, platformFee, (i + 1) * 2, (i + 1) * 2]);

      console.log(`✅ Created Order #${orderId} & Charity Donation: £${donationAmount} (${tier}% of £${price}) for Ad #${ad.id}`);
    }

    // 5. Query total donations for User 144 to verify
    const [totalDonations] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_donated_sales,
        SUM(donation_amount) as total_amount_donated
      FROM charity_donations 
      WHERE seller_id = ? AND status = 'completed'
    `, [userId]);

    console.log('\n📊 Summary of User 144 (Oliver Taylor) Donations:');
    console.log(`   Total Completed Donated Sales: ${totalDonations[0].total_donated_sales}`);
    console.log(`   Total Amount Donated to Charity: £${parseFloat(totalDonations[0].total_amount_donated).toFixed(2)}`);
    console.log('🎉 Seeding successfully completed!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding User 144 donations:', err);
    process.exit(1);
  }
}

seedUser144Donations();
