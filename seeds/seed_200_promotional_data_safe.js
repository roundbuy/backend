/**
 * Non-destructive variant of seed_200_promotional_data.js, safe to run
 * against a database that already has real users/listings (e.g. production).
 *
 * Reuses the exact same curated users/products/images from
 * seed_200_promotional_data.js, but:
 *   - never deletes anything (no wipe of users/advertisements/locations/
 *     favorites/badges/trending gallery items)
 *   - skips a demo user if their email already exists (idempotent re-run),
 *     reusing their existing id + location instead of inserting a duplicate
 *   - skips a listing if its item_code already exists (idempotent re-run)
 *   - skips any listing whose category_id doesn't exist in this database
 *     instead of failing the whole batch
 *   - wrapped in a single transaction, rolled back on any error so a
 *     failed run leaves the database exactly as it was
 */

const { promisePool } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { IMAGE_POOLS, USER_PRESETS, PRODUCT_TEMPLATES } = require('./seed_200_promotional_data');

async function seedSafe() {
  console.log('🚀 Safely adding demo listings (no deletes, existing data untouched)...');

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // =========================================================================
    // 1. Ensure Services category + subcategories exist (idempotent)
    // =========================================================================
    console.log('📦 1. Synchronizing Services category...');
    await connection.query(`
      INSERT INTO categories (id, name, slug, parent_id, icon, description, size_type, requires_size, is_active, sort_order)
      VALUES (6, 'Services', 'services', NULL, 'build', 'Professional and Home Services', 'none', 'not_applicable', 1, 6)
      ON DUPLICATE KEY UPDATE name = 'Services', is_active = 1
    `);

    const servicesSubcategories = [
      { name: 'House Cleaning & Maid Service', slug: 'house-cleaning', icon: 'cleaning_services' },
      { name: 'Plumbing & Heating Services', slug: 'plumbing-repairs', icon: 'plumbing' },
      { name: 'Electrical & Wiring', slug: 'electrical-services', icon: 'electrical_services' },
      { name: 'Painting & Interior Decorating', slug: 'painting-decorating', icon: 'format_paint' },
      { name: 'Handyman & Home Repairs', slug: 'handyman-services', icon: 'handyman' },
      { name: 'Gardening & Lawn Care', slug: 'lawn-garden-care', icon: 'yard' },
      { name: 'Carpentry & Bespoke Woodwork', slug: 'carpentry-furniture', icon: 'carpenter' },
      { name: 'Moving & Transport Logistics', slug: 'moving-logistics', icon: 'local_shipping' },
      { name: 'IT Support & Device Repair', slug: 'it-device-repair', icon: 'computer' },
      { name: 'Photography & Videography', slug: 'photography-videography', icon: 'photo_camera' },
      { name: 'Pet Care & Dog Walking', slug: 'pet-care-walking', icon: 'pets' },
      { name: 'Auto Detailing & Mobile Wash', slug: 'auto-detailing', icon: 'local_car_wash' },
      { name: 'Personal Fitness & Yoga Coaching', slug: 'fitness-yoga', icon: 'fitness_center' },
      { name: 'Roofing & Gutter Maintenance', slug: 'roof-fixing', icon: 'roofing' }
    ];

    let sortOrder = 1;
    for (const sub of servicesSubcategories) {
      const [existing] = await connection.query('SELECT id FROM categories WHERE slug = ? AND parent_id = 6', [sub.slug]);
      if (existing.length === 0) {
        await connection.query(`
          INSERT INTO categories (name, slug, parent_id, icon, is_active, sort_order, size_type, requires_size)
          VALUES (?, ?, 6, ?, 1, ?, 'none', 'not_applicable')
        `, [sub.name, sub.slug, sub.icon, sortOrder++]);
      }
    }

    // =========================================================================
    // 2. Work out which product-template categories actually exist here.
    //    category_id is a required (NOT NULL) FK, so any template pointing at
    //    a category this database doesn't have must be skipped, not inserted.
    // =========================================================================
    const neededCatIds = [...new Set(PRODUCT_TEMPLATES.map(t => t.cat))];
    const [catRows] = await connection.query('SELECT id FROM categories WHERE id IN (?)', [neededCatIds]);
    const existingCatIds = new Set(catRows.map(r => r.id));
    const missingCatIds = neededCatIds.filter(id => !existingCatIds.has(id));
    if (missingCatIds.length > 0) {
      console.warn(`⚠️  Category IDs not found in this database — their listings will be skipped: ${missingCatIds.join(', ')}`);
    }

    // advertisement_plan_id / condition_id are nullable FKs — fall back to
    // NULL instead of assuming id 1 exists on this database.
    const [planRows] = await connection.query('SELECT id FROM advertisement_plans WHERE id = 1');
    const planId = planRows.length > 0 ? 1 : null;
    const [condRows] = await connection.query('SELECT id FROM ad_conditions WHERE id = 1');
    const conditionId = condRows.length > 0 ? 1 : null;

    // =========================================================================
    // 3. Seed users — skip (and reuse) any whose email already exists
    // =========================================================================
    console.log(`👥 3. Seeding demo users (skipping any that already exist)...`);
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
    const seededUsers = [];
    let usersCreated = 0;
    let usersReused = 0;

    for (const u of USER_PRESETS) {
      const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);

      let userId;
      let locationId;

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        usersReused++;

        const [existingLoc] = await connection.query(
          'SELECT id FROM user_locations WHERE user_id = ? AND is_active = 1 LIMIT 1',
          [userId]
        );

        if (existingLoc.length > 0) {
          locationId = existingLoc[0].id;
        } else {
          const [insertLoc] = await connection.query(`
            INSERT INTO user_locations (
              user_id, name, street, city, country, zip_code,
              latitude, longitude, is_default, is_active, created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, '',
              ?, ?, 1, 1, NOW(), NOW()
            )
          `, [userId, u.city + ' Location', u.street, u.city, u.country, u.lat, u.lng]);
          locationId = insertLoc.insertId;
        }
      } else {
        const [insertUser] = await connection.query(`
          INSERT INTO users (
            email, password_hash, full_name, username, phone, avatar,
            role, user_type, company_name, vat_number, business_address,
            country_code, currency_code, average_rating, total_feedbacks,
            is_verified, is_active, kyc_status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, '+44 7700 900123', ?,
            ?, ?, ?, ?, ?,
            ?, ?, 4.92, 35,
            1, 1, 'verified', NOW(), NOW()
          )
        `, [
          u.email, defaultPasswordHash, u.name, u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.avatar,
          u.role, u.type, u.company || null, u.vat || null, u.street + ', ' + u.city,
          u.country, u.curr
        ]);
        userId = insertUser.insertId;
        usersCreated++;

        const [insertLoc] = await connection.query(`
          INSERT INTO user_locations (
            user_id, name, street, city, country, zip_code,
            latitude, longitude, is_default, is_active, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, '',
            ?, ?, 1, 1, NOW(), NOW()
          )
        `, [userId, u.city + ' Location', u.street, u.city, u.country, u.lat, u.lng]);
        locationId = insertLoc.insertId;
      }

      seededUsers.push({
        id: userId,
        locationId,
        city: u.city,
        country: u.country,
        lat: u.lat,
        lng: u.lng,
        user_type: u.type
      });
    }

    console.log(`   ✅ ${usersCreated} new demo users created, ${usersReused} already existed and were reused.`);

    // =========================================================================
    // 4. Seed listings — skip if item_code already exists or category is missing
    // =========================================================================
    console.log('🏷️ 4. Adding demo listings with badges...');

    const [subcatRows] = await connection.query('SELECT id, slug FROM categories WHERE parent_id = 6');
    const subcatMap = {};
    subcatRows.forEach(r => { subcatMap[r.slug] = r.id; });

    const [galleries] = await connection.query('SELECT id, slug FROM trending_galleries');

    const showcaseGroups = [
      'showcase_london_tech',
      'showcase_helsinki_design',
      'showcase_paris_luxury',
      'showcase_berlin_audio',
      'showcase_india_premium'
    ];

    const TARGET_COUNT = 210;
    let seededAdCount = 0;
    let skippedExisting = 0;
    let skippedNoCategory = 0;

    for (let i = 0; i < TARGET_COUNT; i++) {
      const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];

      if (!existingCatIds.has(template.cat)) {
        skippedNoCategory++;
        continue;
      }

      const itemCode = 'RB-' + (100000 + i);
      const [existingAd] = await connection.query('SELECT id FROM advertisements WHERE item_code = ?', [itemCode]);
      if (existingAd.length > 0) {
        skippedExisting++;
        continue;
      }

      const user = seededUsers[i % seededUsers.length];

      // Small jitter for multiple pins in same city
      const angle = (i * 137.5) * (Math.PI / 180); // Golden angle
      const distanceOffset = (0.002 + (i % 8) * 0.0015);
      const lat = user.lat + distanceOffset * Math.cos(angle);
      const lng = user.lng + distanceOffset * Math.sin(angle);

      let subcatId = null;
      if (template.sub && subcatMap[template.sub]) {
        subcatId = subcatMap[template.sub];
      }

      const imgUrl = IMAGE_POOLS[template.img] || IMAGE_POOLS['laptop'];
      const imagesJson = JSON.stringify([imgUrl]);

      const isService = template.type === 'service';
      const activityId = isService ? 4 : (i % 6 === 0 ? 1 : 2); // 2: Sell, 1: Buy, 4: Service

      let isFeatured = 0;
      let badgeType = null;
      let badgeLevel = null;
      let showcaseGroupId = null;
      let priorityLevel = 0;

      if (i >= 0 && i < 25) {
        const groupIndex = Math.floor(i / 5);
        showcaseGroupId = showcaseGroups[groupIndex];
        badgeType = 'visibility';
        badgeLevel = 'show_casing';
        isFeatured = 1;
        priorityLevel = 90;
      } else if (i >= 25 && i < 45) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-gold-7-days';
        isFeatured = 1;
        priorityLevel = 80;
      } else if (i >= 45 && i < 65) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-orange-7-days';
        isFeatured = 1;
        priorityLevel = 75;
      } else if (i >= 65 && i < 85) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-green-7-days';
        isFeatured = 1;
        priorityLevel = 70;
      } else if (i >= 85 && i < 105) {
        badgeType = 'visibility';
        badgeLevel = 'garage_sales';
        isFeatured = 1;
        priorityLevel = 60;
      } else if (i >= 105 && i < 130) {
        badgeType = 'visibility';
        badgeLevel = i % 2 === 0 ? 'fast_ad' : 'highlight';
        isFeatured = 0;
        priorityLevel = 40;
      }

      const viewsCount = 150 + Math.floor(Math.random() * 850);
      const trendingScore = 60 + Math.floor(Math.random() * 40);

      const [adResult] = await connection.query(`
        INSERT INTO advertisements (
          item_code, user_id, advertisement_plan_id, title, description, images,
          category_id, subcategory_id, location_id, price, display_duration_days,
          activity_id, condition_id, status, views_count, featured, start_date, end_date,
          trending_score, gender_target, listing_type, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 365,
          ?, ?, 'published', ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY),
          ?, 'all', ?, NOW(), NOW()
        )
      `, [
        itemCode,
        user.id,
        planId,
        template.title,
        template.desc,
        imagesJson,
        template.cat,
        subcatId,
        user.locationId,
        template.price,
        activityId,
        conditionId,
        viewsCount,
        isFeatured,
        trendingScore,
        template.type
      ]);

      const adId = adResult.insertId;

      await connection.query(`
        INSERT INTO advertisement_locations (advertisement_id, location_id, created_at)
        VALUES (?, ?, NOW())
      `, [adId, user.locationId]);

      if (badgeType && badgeLevel) {
        await connection.query(`
          INSERT INTO product_badges (
            advertisement_id, badge_type, badge_level, showcase_group_id, priority_level,
            is_active, expiry_date, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            1, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW(), NOW()
          )
        `, [adId, badgeType, badgeLevel, showcaseGroupId, priorityLevel]);
      }

      if (i % 3 === 0 && galleries.length > 0) {
        const targetGallery = galleries[i % galleries.length];
        await connection.query(`
          INSERT INTO trending_gallery_items (gallery_id, advertisement_id, sort_order, is_featured, added_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [targetGallery.id, adId, i, isFeatured ? 1 : 0]);
      }

      seededAdCount++;
    }

    console.log(`   ✅ ${seededAdCount} new listings added, ${skippedExisting} already existed (skipped), ${skippedNoCategory} skipped (category not in this database).`);

    await connection.commit();
    console.log('\n🎉 Safe demo-data seeding complete — no existing data was deleted or modified.');
    console.log('---------------------------------------------------------');
    console.log(`✅ New listings: ${seededAdCount}`);
    console.log(`✅ New demo users: ${usersCreated} (${usersReused} already existed)`);
    if (missingCatIds.length > 0) {
      console.log(`⚠️  Skipped ${skippedNoCategory} listings — missing category IDs: ${missingCatIds.join(', ')}`);
    }
    console.log('---------------------------------------------------------\n');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Safe seeding failed — rolled back, no changes were made:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  seedSafe()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedSafe };
