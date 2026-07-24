const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function seedServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy_db'
  });

  try {
    console.log('🌱 Starting Services Flow seeding...');

    // 1. Ensure parent category 'Services' exists (id: 6)
    const [parents] = await connection.query('SELECT id FROM categories WHERE id = 6 OR name = "Services"');
    let parentId = 6;
    if (parents.length === 0) {
      console.log('Creating parent category "Services"...');
      const [insertParent] = await connection.query(
        'INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) VALUES (6, "Services", "services", NULL, TRUE, 6)'
      );
      parentId = insertParent.insertId || 6;
    } else {
      parentId = parents[0].id;
    }

    // 2. Clear existing subcategories of 'Services' to avoid duplicate key issues
    console.log('Clearing existing subcategories of category ID:', parentId);
    const [existingSubcats] = await connection.query('SELECT id FROM categories WHERE parent_id = ?', [parentId]);
    const subcatIds = existingSubcats.map(s => s.id);
    if (subcatIds.length > 0) {
      const [existingAds] = await connection.query('SELECT id FROM advertisements WHERE subcategory_id IN (?)', [subcatIds]);
      const adIds = existingAds.map(a => a.id);
      if (adIds.length > 0) {
        console.log('Clearing advertisement locations...');
        await connection.query('DELETE FROM advertisement_locations WHERE advertisement_id IN (?)', [adIds]);
        console.log('Clearing advertisements...');
        await connection.query('DELETE FROM advertisements WHERE id IN (?)', [adIds]);
      }
      await connection.query('DELETE FROM categories WHERE parent_id = ?', [parentId]);
    }

    // 3. Define services subcategories
    const subcategories = [
      { name: 'House Cleaning', slug: 'house-cleaning' },
      { name: 'Car Washing', slug: 'car-washing' },
      { name: 'Roof Fixing', slug: 'roof-fixing' },
      { name: 'Lawn & Garden Care', slug: 'lawn-garden-care' },
      { name: 'Plumbing repairs', slug: 'plumbing-repairs' },
      { name: 'Electrical services', slug: 'electrical-services' },
      { name: 'Painting & Decorating', slug: 'painting-decorating' },
      { name: 'Handyman services', slug: 'handyman-services' }
    ];

    const insertedSubcategories = [];
    for (let i = 0; i < subcategories.length; i++) {
      const sub = subcategories[i];
      const [result] = await connection.query(
        'INSERT INTO categories (name, slug, parent_id, is_active, sort_order) VALUES (?, ?, ?, TRUE, ?)',
        [sub.name, sub.slug, parentId, i + 1]
      );
      insertedSubcategories.push({
        id: result.insertId,
        name: sub.name,
        slug: sub.slug
      });
    }
    console.log(`✓ Seeded ${insertedSubcategories.length} service subcategories.`);

    // 4. Fetch a user ID to own these sample advertisements
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      throw new Error('No users found in database to assign advertisements to. Please seed users first.');
    }
    const userId = users[0].id;
    console.log(`Using user ID ${userId} to own sample service advertisements.`);

    // 5. Seed multiple distinct locations in Luton to spread the markers out on the map
    console.log('Cleaning up previous user locations for service spread...');
    await connection.query(
      'DELETE FROM user_locations WHERE user_id = ? AND (name LIKE "Luton %" OR name IN ("High Town", "Bury Park", "Stopsley"))',
      [userId]
    );

    const locationsToSeed = [
      { name: "Luton Center", city: "Luton", country: "United Kingdom", lat: 51.875462, lng: -0.372755 },
      { name: "Luton North", city: "Luton", country: "United Kingdom", lat: 51.890462, lng: -0.372755 },
      { name: "Luton South", city: "Luton", country: "United Kingdom", lat: 51.860462, lng: -0.372755 },
      { name: "Luton East", city: "Luton", country: "United Kingdom", lat: 51.875462, lng: -0.352755 },
      { name: "Luton West", city: "Luton", country: "United Kingdom", lat: 51.875462, lng: -0.392755 },
      { name: "High Town", city: "Luton", country: "United Kingdom", lat: 51.881462, lng: -0.365755 },
      { name: "Bury Park", city: "Luton", country: "United Kingdom", lat: 51.883462, lng: -0.382755 },
      { name: "Stopsley", city: "Luton", country: "United Kingdom", lat: 51.892462, lng: -0.345755 }
    ];

    const locationIds = [];
    for (const loc of locationsToSeed) {
      const [insertLoc] = await connection.query(
        'INSERT INTO user_locations (user_id, name, city, country, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
        [userId, loc.name, loc.city, loc.country, loc.lat, loc.lng]
      );
      locationIds.push(insertLoc.insertId);
    }
    console.log(`✓ Seeded ${locationIds.length} geographical locations around Luton.`);

    // 6. Define mock service advertisements (activity_id = 4 represents Services)
    const activityId = 4; 
    const mockAds = {
      'house-cleaning': [
        { title: "Peter's House Cleaning", price: 300.00, desc: "Professional and deep cleaning services for houses, apartments, and offices. Includes dusting, vacuuming, mopping, and window cleaning." },
        { title: "Quick Clean Domestic Services", price: 25.00, desc: "Reliable weekly domestic cleaning. Experienced cleaners, fully insured, eco-friendly supplies." }
      ],
      'car-washing': [
        { title: "Eco Wash Mobile Valeting", price: 40.00, desc: "Mobile car washing and detailing at your doorstep. We use eco-friendly waterless technology." },
        { title: "Luton Hand Car Wash", price: 15.00, desc: "Fast and professional hand car wash. Full exterior clean, wheel shine, and quick dry." }
      ],
      'roof-fixing': [
        { title: "Apex Roofers & Repairs", price: 450.00, desc: "Professional roof maintenance, tiling repairs, leak prevention, and gutter clearing services." },
        { title: "J&D Gutter Cleaning & Roofing", price: 120.00, desc: "Minor roof repairs, flashing installation, and full gutter maintenance." }
      ],
      'lawn-garden-care': [
        { title: "Greenfingers Lawn Mowing", price: 35.00, desc: "Lawn care, regular grass cutting, hedge trimming, weed control, and garden leaf clearance." },
        { title: "Oakwood Tree Services & Landscaping", price: 250.00, desc: "Tree surgery, stump grinding, turfing, and complete garden designs." }
      ],
      'plumbing-repairs': [
        { title: "Emergency Plumbing 24/7", price: 80.00, desc: "Rapid response plumbing. We fix leaking pipes, blocked drains, running toilets, and dripping taps." },
        { title: "Luton Heating & Gas Plumbers", price: 120.00, desc: "Boiler servicing, radiator bleeding, and central heating installations by Gas Safe engineers." }
      ],
      'electrical-services': [
        { title: "VoltMaster Certified Electrician", price: 95.00, desc: "Domestic electrician. Rewiring, extra sockets, light fittings, fuse box upgrades, and safety certificates." },
        { title: "Luton Home Automation & Sparks", price: 150.00, desc: "Smart thermostat setup, CCTV installations, and general home electrical services." }
      ],
      'painting-decorating': [
        { title: "Elite Painters & Decorators", price: 200.00, desc: "Internal and external painting services. High quality finishes, wallpapering, and wood staining." },
        { title: "BrightHome Paint Services", price: 150.00, desc: "Single room refreshes, ceiling paints, door spraying, and quick touch-ups." }
      ],
      'handyman-services': [
        { title: "Local Handyman & Flatpack Assembly", price: 30.00, desc: "Furniture assembly, picture hanging, shelf mounting, TV wall-mounting, and minor carpentry." },
        { title: "Luton Property Maintenance", price: 60.00, desc: "Fixing fence panels, door lock replacements, deck repairs, and small odd jobs." }
      ]
    };

    let totalAdsSeeded = 0;
    for (const sub of insertedSubcategories) {
      const ads = mockAds[sub.slug] || [];
      for (const ad of ads) {
        // Insert advertisement row
        const [insertAd] = await connection.query(
          `INSERT INTO advertisements 
           (user_id, category_id, subcategory_id, activity_id, title, description, price, status, images, display_duration_days, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', '["/uploads/sample-service.jpg"]', 30, NOW(), NOW())`,
          [userId, parentId, sub.id, activityId, ad.title, ad.desc, ad.price]
        );

        const newAdId = insertAd.insertId;

        // Assign to a different location in round-robin fashion
        const targetLocationId = locationIds[totalAdsSeeded % locationIds.length];

        // Insert advertisement location mapping
        await connection.query(
          'INSERT INTO advertisement_locations (advertisement_id, location_id) VALUES (?, ?)',
          [newAdId, targetLocationId]
        );

        totalAdsSeeded++;
      }
    }

    console.log(`✓ Seeded ${totalAdsSeeded} sample service listings.`);
    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seedServices();
