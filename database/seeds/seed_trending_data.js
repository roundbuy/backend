const { promisePool } = require('../../src/config/database');

async function seed() {
  console.log('🌱 Starting trending data seeding...');
  try {
    // 1. Fetch a valid user_id to avoid foreign key errors
    const [users] = await promisePool.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      throw new Error('No users found in database. Please register/create a user first.');
    }
    const userId = users[0].id;
    console.log(`👤 Using valid User ID: ${userId}`);

    // 2. Fetch a valid location_id (if exists, else null)
    let locationId = null;
    try {
      const [locations] = await promisePool.query('SELECT id FROM locations LIMIT 1');
      if (locations.length > 0) {
        locationId = locations[0].id;
      }
    } catch (err) {
      console.log('⚠️ Locations table check skipped or failed:', err.message);
    }
    console.log(`📍 Using Location ID: ${locationId}`);

    // 3. Clear existing trending gallery items
    await promisePool.query('DELETE FROM trending_gallery_items');
    console.log('🧹 Cleared existing trending gallery items.');

    // 4. Clean up any previous seeded trending advertisements (identified by custom item_code prefix)
    await promisePool.query("DELETE FROM advertisements WHERE item_code LIKE 'SEED-TREND-%'");
    console.log('🧹 Cleared previous seeded trending advertisements.');

    // 5. Update Trending Galleries with high-quality hero images and descriptions
    const galleriesUpdates = [
      {
        id: 1,
        name: 'Most Popular',
        description: 'Vibrant, handpicked fashion trending this week.',
        hero_image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        name: "Women's Trending",
        description: 'Elegant dresses, high-fashion coats, and accessories.',
        hero_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        name: "Men's Trending",
        description: 'Sharp suits, vintage jackets, and streetwear.',
        hero_image_url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 4,
        name: 'Jeans & Denim',
        description: 'Classic denim jackets, slim-fit, and vintage jeans.',
        hero_image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 5,
        name: 'Sneakers & Shoes',
        description: 'From sporty running kicks to designer boots.',
        hero_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 6,
        name: 'Vintage Finds',
        description: 'Rare leather jackets and retro statement accessories.',
        hero_image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 7,
        name: 'Designer Luxury',
        description: 'Exclusive gold watches, fine leather, and premium attire.',
        hero_image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const g of galleriesUpdates) {
      await promisePool.query(
        'UPDATE trending_galleries SET name = ?, description = ?, hero_image_url = ? WHERE id = ?',
        [g.name, g.description, g.hero_image_url, g.id]
      );
    }
    console.log('✅ Updated trending galleries definitions.');

    // 6. Define beautiful fashion items
    const items = [
      // JEANS
      {
        item_code: 'SEED-TREND-01',
        title: "Levi's 501 Classic Jeans",
        description: "Standard fit, robust vintage wash 501s in perfect condition.",
        price: 89.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'all',
        trending_score: 95,
        views_count: 1200,
        category_id: 86, // Shoes/clothing fallback
        galleries: [1, 4] // Most Popular, Jeans
      },
      {
        item_code: 'SEED-TREND-02',
        title: "Premium Blue Denim Jacket",
        description: "Medium-wash rugged denim jacket with high-grade metal buttons.",
        price: 110.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'men',
        trending_score: 88,
        views_count: 850,
        category_id: 86,
        galleries: [3, 4] // Men's Trending, Jeans
      },
      // SNEAKERS
      {
        item_code: 'SEED-TREND-03',
        title: "Nike Air Max Sports Kicks",
        description: "Vibrant red and white sports shoes with comfortable air-cushioned soles.",
        price: 145.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'all',
        trending_score: 98,
        views_count: 1450,
        category_id: 86,
        galleries: [1, 5] // Most Popular, Sneakers
      },
      {
        item_code: 'SEED-TREND-04',
        title: "Adidas Ultraboost Pastel",
        description: "Soft pink breathable knit fabric sneakers, perfect for athletic fashion.",
        price: 160.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'women',
        trending_score: 91,
        views_count: 980,
        category_id: 86,
        galleries: [2, 5] // Women's Trending, Sneakers
      },
      // VINTAGE
      {
        item_code: 'SEED-TREND-05',
        title: "Retro Coach Leather Handbag",
        description: "Rare 90s vintage leather handbag in rich tan brown with solid brass fittings.",
        price: 320.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'women',
        trending_score: 96,
        views_count: 1150,
        category_id: 87, // Accessories
        galleries: [1, 2, 6] // Most Popular, Women's, Vintage
      },
      {
        item_code: 'SEED-TREND-06',
        title: "Vintage Biker Leather Jacket",
        description: "Genuine heavy black leather motorcycle jacket with zippers and belt detail.",
        price: 280.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'all',
        trending_score: 87,
        views_count: 760,
        category_id: 86,
        galleries: [3, 6] // Men's Trending, Vintage
      },
      // DESIGNER
      {
        item_code: 'SEED-TREND-07',
        title: "Gold Luxury Chronograph Watch",
        description: "Chronomaster luxury designer watch with gold case and textured leather band.",
        price: 799.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'men',
        trending_score: 99,
        views_count: 1980,
        category_id: 87,
        galleries: [1, 3, 7] // Most Popular, Men's, Designer
      },
      {
        item_code: 'SEED-TREND-08',
        title: "Stella McCartney Floral Gown",
        description: "Red floral silk designer gown with elegant layered skirt and open back.",
        price: 650.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'women',
        trending_score: 94,
        views_count: 1340,
        category_id: 86,
        galleries: [1, 2, 7] // Most Popular, Women's, Designer
      },
      {
        item_code: 'SEED-TREND-09',
        title: "Tortoise Shell Designer Sunglasses",
        description: "UV-protected high-fashion designer sunglasses with gold logo detailing.",
        price: 180.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'all',
        trending_score: 85,
        views_count: 620,
        category_id: 87,
        galleries: [7] // Designer
      },
      // KIDS / CHILDREN
      {
        item_code: 'SEED-TREND-10',
        title: "Kids Yellow Hooded Raincoat",
        description: "Bright yellow rubberized raincoat with warm fleece lining and safety reflectors.",
        price: 45.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'children',
        trending_score: 89,
        views_count: 450,
        category_id: 79, // Baby / Toddler
        galleries: [1] // Most Popular
      },
      {
        item_code: 'SEED-TREND-11',
        title: "Kids Stripe Knit Tee",
        description: "100% organic cotton breathable striped tee, perfect for active play.",
        price: 25.00,
        images: JSON.stringify(["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=600&q=80"]),
        gender_target: 'children',
        trending_score: 82,
        views_count: 320,
        category_id: 79,
        galleries: [] // Algorithmic feed only
      }
    ];

    // 7. Insert advertisements
    for (const item of items) {
      const [insertRes] = await promisePool.query(`
        INSERT INTO advertisements (
          item_code, user_id, title, description, price, images,
          gender_target, trending_score, views_count, category_id,
          location_id, status, featured, display_duration_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 30)
      `, [
        item.item_code, userId, item.title, item.description, item.price, item.images,
        item.gender_target, item.trending_score, item.views_count, item.category_id,
        locationId
      ]);

      const insertedId = insertRes.insertId;
      console.log(`✨ Seeded Item: "${item.title}" with ID: ${insertedId}`);

      // Link to appropriate galleries
      if (item.galleries && item.galleries.length > 0) {
        for (const galleryId of item.galleries) {
          await promisePool.query(`
            INSERT INTO trending_gallery_items (gallery_id, advertisement_id, is_featured, sort_order)
            VALUES (?, ?, 1, 0)
          `, [galleryId, insertedId]);
        }
      }
    }

    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Error seeding trending data:', error);
  } finally {
    process.exit(0);
  }
}

seed();
