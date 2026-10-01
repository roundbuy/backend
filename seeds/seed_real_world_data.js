/**
 * Comprehensive Real-World Seeder for RoundBuy
 * 
 * 1. Seeds & Updates Categories with comprehensive Services subcategories (manageable via Admin Panel)
 * 2. Deletes unwanted dummy test data while preserving Admin user(s)
 * 3. Seeds realistic Users (Individuals & Verified Business Users) across:
 *    - United Kingdom (London - Westminster, Kensington, Camden, Islington, Shoreditch, Richmond, Greenwich)
 *    - Finland (Helsinki - Kamppi, Kallio, Töölö, Punavuori, Espoo - Tapiola, Leppävaara)
 *    - France (Paris - Le Marais, Montmartre, Saint-Germain, Bastille, Lyon)
 *    - Germany (Berlin - Mitte, Prenzlauer Berg, Kreuzberg, Charlottenburg, Munich - Schwabing)
 *    - India (Delhi - Hauz Khas, GK, Mumbai - Bandra, Juhu, Bangalore - Indiranagar, Koramangala)
 * 4. Seeds realistic, active user_locations with accurate lat/long coordinates
 * 5. Seeds rich listings mapped to all main categories with SHORT, PUNCHY TITLES,
 *    high-definition Unsplash photos, accurate pricing, condition, and linked advertisement_locations.
 */

const { promisePool } = require('../src/config/database');
const bcrypt = require('bcrypt');

// High-Definition Unsplash Photos by category/type
const IMAGES = {
  // Electronics
  macbook: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80'
  ],
  iphone: [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80'
  ],
  sonyCamera: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80'
  ],
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80'
  ],
  smartwatch: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80'
  ],
  ps5: [
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80'
  ],
  ipad: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1000&q=80'
  ],

  // Furniture & Home
  scandiSofa: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80'
  ],
  diningTable: [
    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1000&q=80'
  ],
  armchair: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80'
  ],
  coffeeTable: [
    'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1000&q=80'
  ],
  floorLamp: [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
  ],

  // Bicycles & Vehicles
  gravelBike: [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80'
  ],
  electricBike: [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1000&q=80'
  ],
  foldingBike: [
    'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1000&q=80'
  ],
  vintageVespa: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80'
  ],

  // Fashion & Watches
  leatherJacket: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'
  ],
  luxuryWatch: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80'
  ],
  sneakers: [
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80'
  ],
  trenchCoat: [
    'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=80'
  ],

  // Sports, Music & Hobbies
  electricGuitar: [
    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80'
  ],
  djController: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80'
  ],
  tennisRacket: [
    'https://images.unsplash.com/photo-1617083934555-563d4157173b?auto=format&fit=crop&w=1000&q=80'
  ],
  campingTent: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80'
  ],

  // SERVICES
  houseCleaning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1000&q=80'
  ],
  plumbing: [
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1000&q=80'
  ],
  electrician: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&w=1000&q=80'
  ],
  painting: [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=80'
  ],
  gardening: [
    'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1000&q=80'
  ],
  carpentry: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1000&q=80'
  ],
  moving: [
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80'
  ],
  techRepair: [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1000&q=80'
  ],
  photography: [
    'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80'
  ],
  petCare: [
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=80'
  ],
  carDetailing: [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1000&q=80'
  ],
  fitnessTraining: [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80'
  ],
  roofing: [
    'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1000&q=80'
  ],
  handyman: [
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1000&q=80'
  ]
};

// User Profile Avatars
const AVATARS = {
  // UK
  oliver: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  charlotte: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  george: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  emma: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',

  // Finland
  mikko: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  sofia: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  antti: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',

  // France
  alexandre: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  camille: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',

  // Germany
  maximilian: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  lukas: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',

  // India
  aarav: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  priya: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  rohan: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',

  // Business Logos / Avatars
  businessUK: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
  businessFinland: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
  businessFrance: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  businessGermany: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80',
  businessIndia: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
};

async function seedRealWorldData() {
  console.log('🚀 Starting Comprehensive Real-World Seed with Short Titles & Rich Categories...');

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // =========================================================================
    // STEP 1: Services Subcategories (Manageable from Admin Panel)
    // =========================================================================
    console.log('📦 1. Setting up Services & Categories...');

    await connection.query(`
      INSERT INTO categories (id, name, slug, parent_id, icon, description, size_type, requires_size, is_active, sort_order)
      VALUES (6, 'Services', 'services', NULL, 'build', 'Professional and Home Services', 'none', 'not_applicable', 1, 6)
      ON DUPLICATE KEY UPDATE 
        name = 'Services', 
        slug = 'services',
        description = 'Professional and Home Services',
        is_active = 1
    `);

    const servicesSubcategories = [
      { name: 'House Cleaning & Maid Service', slug: 'house-cleaning', icon: 'cleaning_services', desc: 'Residential & commercial deep cleaning' },
      { name: 'Plumbing & Heating Services', slug: 'plumbing-repairs', icon: 'plumbing', desc: 'Emergency leak repair, boiler maintenance & installations' },
      { name: 'Electrical & Wiring', slug: 'electrical-services', icon: 'electrical_services', desc: 'Certified electrical wiring, lighting & EV chargers' },
      { name: 'Painting & Interior Decorating', slug: 'painting-decorating', icon: 'format_paint', desc: 'Interior & exterior painting and plastering' },
      { name: 'Handyman & Home Repairs', slug: 'handyman-services', icon: 'handyman', desc: 'Furniture assembly, wall mounting & fixings' },
      { name: 'Gardening & Lawn Care', slug: 'lawn-garden-care', icon: 'yard', desc: 'Landscaping, hedge trimming & garden maintenance' },
      { name: 'Carpentry & Bespoke Woodwork', slug: 'carpentry-furniture', icon: 'carpenter', desc: 'Custom shelves, doors, wardrobes & kitchen fittings' },
      { name: 'Moving & Transport Logistics', slug: 'moving-logistics', icon: 'local_shipping', desc: 'House moving, van hire & heavy item transport' },
      { name: 'IT Support & Device Repair', slug: 'it-device-repair', icon: 'computer', desc: 'PC, Mac, iPhone screen repair & network setup' },
      { name: 'Photography & Videography', slug: 'photography-videography', icon: 'photo_camera', desc: 'Portrait, event, real estate & product photography' },
      { name: 'Pet Care & Dog Walking', slug: 'pet-care-walking', icon: 'pets', desc: 'Daily dog walks, pet sitting & grooming' },
      { name: 'Auto Detailing & Mobile Wash', slug: 'auto-detailing', icon: 'local_car_wash', desc: 'Interior detailing, ceramic coating & mobile car wash' },
      { name: 'Personal Fitness & Yoga Coaching', slug: 'fitness-yoga', icon: 'fitness_center', desc: '1-on-1 personal training & wellness coaching' },
      { name: 'Roofing & Gutter Maintenance', slug: 'roof-fixing', icon: 'roofing', desc: 'Roof tile replacement, leak prevention & gutter clear' }
    ];

    let sortOrder = 1;
    for (const sub of servicesSubcategories) {
      const [existing] = await connection.query('SELECT id FROM categories WHERE slug = ? AND parent_id = 6', [sub.slug]);
      if (existing.length === 0) {
        await connection.query(`
          INSERT INTO categories (name, slug, parent_id, icon, description, size_type, requires_size, is_active, sort_order)
          VALUES (?, ?, 6, ?, ?, 'none', 'not_applicable', 1, ?)
        `, [sub.name, sub.slug, sub.icon, sub.desc, sortOrder++]);
      } else {
        await connection.query(`
          UPDATE categories 
          SET name = ?, icon = ?, description = ?, is_active = 1, sort_order = ?
          WHERE id = ?
        `, [sub.name, sub.icon, sub.desc, sortOrder++, existing[0].id]);
      }
    }

    // =========================================================================
    // STEP 2: Clean up unwanted old dummy data (Preserving Admin user(s))
    // =========================================================================
    console.log('🧹 2. Cleaning old dummy data while keeping Admin users...');

    const [adminRows] = await connection.query("SELECT id FROM users WHERE role = 'admin'");
    const adminIds = adminRows.map(r => r.id);
    console.log('   Admin user IDs preserved:', adminIds);

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM advertisement_locations');
    await connection.query('DELETE FROM product_badges');
    await connection.query('DELETE FROM favorites');
    await connection.query('DELETE FROM advertisements');
    await connection.query('DELETE FROM user_locations');
    
    if (adminIds.length > 0) {
      await connection.query('DELETE FROM users WHERE id NOT IN (?)', [adminIds]);
    } else {
      await connection.query('DELETE FROM users');
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // =========================================================================
    // STEP 3: Seed Real Users (Individuals + Verified Businesses)
    // =========================================================================
    console.log('👥 3. Seeding Realistic Users across 5 key countries...');

    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    const usersToSeed = [
      // --- UNITED KINGDOM (London) ---
      {
        email: 'oliver.taylor@roundbuy.co.uk',
        full_name: 'Oliver Taylor',
        username: 'olivert',
        phone: '+44 7700 900123',
        avatar: AVATARS.oliver,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'GBR',
        currency_code: 'GBP',
        average_rating: 4.95,
        total_feedbacks: 42,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Westminster Residential',
          street: '18 Victoria Street',
          city: 'London',
          country: 'United Kingdom',
          zip_code: 'SW1H 0EX',
          latitude: 51.4995,
          longitude: -0.1332
        }
      },
      {
        email: 'charlotte.davies@roundbuy.co.uk',
        full_name: 'Charlotte Davies',
        username: 'charlotted',
        phone: '+44 7700 900456',
        avatar: AVATARS.charlotte,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'GBR',
        currency_code: 'GBP',
        average_rating: 4.88,
        total_feedbacks: 29,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Camden Town Home',
          street: '42 Camden High Street',
          city: 'London',
          country: 'United Kingdom',
          zip_code: 'NW1 0JH',
          latitude: 51.5390,
          longitude: -0.1426
        }
      },
      {
        email: 'westminster.services@roundbuy.co.uk',
        full_name: 'William Clark',
        username: 'westminsterserv',
        phone: '+44 20 7946 0192',
        avatar: AVATARS.businessUK,
        role: 'subscriber',
        user_type: 'business',
        company_name: 'Westminster Home & Tech Services Ltd',
        vat_number: 'GB928371940',
        business_address: '104 Kensington High Street, London, W8 4SG',
        country_code: 'GBR',
        currency_code: 'GBP',
        average_rating: 4.98,
        total_feedbacks: 156,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Kensington HQ & Workshop',
          street: '104 Kensington High St',
          city: 'London',
          country: 'United Kingdom',
          zip_code: 'W8 4SG',
          latitude: 51.5014,
          longitude: -0.1918
        }
      },
      {
        email: 'george.evans@roundbuy.co.uk',
        full_name: 'George Evans',
        username: 'georgee',
        phone: '+44 7700 900789',
        avatar: AVATARS.george,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'GBR',
        currency_code: 'GBP',
        average_rating: 4.75,
        total_feedbacks: 18,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Shoreditch Studio',
          street: '88 Redchurch Street',
          city: 'London',
          country: 'United Kingdom',
          zip_code: 'E2 7DD',
          latitude: 51.5245,
          longitude: -0.0763
        }
      },

      // --- FINLAND (Helsinki & Espoo) ---
      {
        email: 'mikko.korhonen@roundbuy.fi',
        full_name: 'Mikko Korhonen',
        username: 'mikkok',
        phone: '+358 40 1234567',
        avatar: AVATARS.mikko,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'FIN',
        currency_code: 'EUR',
        average_rating: 5.00,
        total_feedbacks: 38,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Kamppi City Residence',
          street: 'Fredrikinkatu 34',
          city: 'Helsinki',
          country: 'Finland',
          zip_code: '00100',
          latitude: 60.1674,
          longitude: 24.9351
        }
      },
      {
        email: 'sofia.virtanen@roundbuy.fi',
        full_name: 'Sofia Virtanen',
        username: 'sofiav',
        phone: '+358 45 7654321',
        avatar: AVATARS.sofia,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'FIN',
        currency_code: 'EUR',
        average_rating: 4.92,
        total_feedbacks: 45,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Kallio Apartment',
          street: 'Hämeentie 22',
          city: 'Helsinki',
          country: 'Finland',
          zip_code: '00530',
          latitude: 60.1841,
          longitude: 24.9602
        }
      },
      {
        email: 'nordic.renovation@roundbuy.fi',
        full_name: 'Antti Nieminen',
        username: 'nordiccraft',
        phone: '+358 9 8765432',
        avatar: AVATARS.businessFinland,
        role: 'subscriber',
        user_type: 'business',
        company_name: 'Nordic Clean & Craft Solutions Oy',
        vat_number: 'FI28472910',
        business_address: 'Tapiontori 3, 02100 Espoo, Finland',
        country_code: 'FIN',
        currency_code: 'EUR',
        average_rating: 4.97,
        total_feedbacks: 210,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Tapiola Espoo Service Center',
          street: 'Tapiontori 3',
          city: 'Espoo',
          country: 'Finland',
          zip_code: '02100',
          latitude: 60.1762,
          longitude: 24.8055
        }
      },

      // --- FRANCE (Paris) ---
      {
        email: 'alexandre.dubois@roundbuy.fr',
        full_name: 'Alexandre Dubois',
        username: 'alexdubois',
        phone: '+33 6 12 34 56 78',
        avatar: AVATARS.alexandre,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'FRA',
        currency_code: 'EUR',
        average_rating: 4.89,
        total_feedbacks: 24,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Le Marais Apartment',
          street: 'Rue des Francs-Bourgeois',
          city: 'Paris',
          country: 'France',
          zip_code: '75004',
          latitude: 48.8575,
          longitude: 2.3598
        }
      },
      {
        email: 'atelier.paris@roundbuy.fr',
        full_name: 'Camille Laurent',
        username: 'atelierdeco',
        phone: '+33 1 42 68 55 00',
        avatar: AVATARS.businessFrance,
        role: 'subscriber',
        user_type: 'business',
        company_name: 'Atelier Artisanal Déco & Services Paris',
        vat_number: 'FR84920194821',
        business_address: '15 Boulevard Saint-Germain, 75005 Paris, France',
        country_code: 'FRA',
        currency_code: 'EUR',
        average_rating: 4.96,
        total_feedbacks: 112,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Saint-Germain Workshop',
          street: '15 Boulevard Saint-Germain',
          city: 'Paris',
          country: 'France',
          zip_code: '75005',
          latitude: 48.8512,
          longitude: 2.3489
        }
      },

      // --- GERMANY (Berlin & Munich) ---
      {
        email: 'maximilian.schmidt@roundbuy.de',
        full_name: 'Maximilian Schmidt',
        username: 'maxschmidt',
        phone: '+49 170 1234567',
        avatar: AVATARS.maximilian,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'DEU',
        currency_code: 'EUR',
        average_rating: 4.94,
        total_feedbacks: 33,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Berlin Mitte Residence',
          street: 'Torstraße 140',
          city: 'Berlin',
          country: 'Germany',
          zip_code: '10119',
          latitude: 52.5298,
          longitude: 13.3989
        }
      },
      {
        email: 'muenchen.technik@roundbuy.de',
        full_name: 'Lukas Weber',
        username: 'muenchenworks',
        phone: '+49 89 2345678',
        avatar: AVATARS.businessGermany,
        role: 'subscriber',
        user_type: 'business',
        company_name: 'München Tech & Cycle Works GmbH',
        vat_number: 'DE391048291',
        business_address: 'Leopoldstraße 82, 80802 München, Germany',
        country_code: 'DEU',
        currency_code: 'EUR',
        average_rating: 4.99,
        total_feedbacks: 178,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Schwabing Workshop',
          street: 'Leopoldstraße 82',
          city: 'München',
          country: 'Germany',
          zip_code: '80802',
          latitude: 48.1601,
          longitude: 11.5861
        }
      },

      // --- INDIA (Delhi, Mumbai, Bangalore) ---
      {
        email: 'aarav.sharma@roundbuy.in',
        full_name: 'Aarav Sharma',
        username: 'aaravs',
        phone: '+91 98101 23456',
        avatar: AVATARS.aarav,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'IND',
        currency_code: 'INR',
        average_rating: 4.90,
        total_feedbacks: 27,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Hauz Khas Residence',
          street: 'E-14 Hauz Khas',
          city: 'New Delhi',
          country: 'India',
          zip_code: '110016',
          latitude: 28.5494,
          longitude: 77.2001
        }
      },
      {
        email: 'priya.patel@roundbuy.in',
        full_name: 'Priya Patel',
        username: 'priyap',
        phone: '+91 98200 98765',
        avatar: AVATARS.priya,
        role: 'subscriber',
        user_type: 'private',
        country_code: 'IND',
        currency_code: 'INR',
        average_rating: 4.96,
        total_feedbacks: 51,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Bandra West Apartment',
          street: 'Hill Road, Bandra West',
          city: 'Mumbai',
          country: 'India',
          zip_code: '400050',
          latitude: 19.0596,
          longitude: 72.8295
        }
      },
      {
        email: 'apex.solutions@roundbuy.in',
        full_name: 'Rohan Mehta',
        username: 'apexindia',
        phone: '+91 80 4123 4567',
        avatar: AVATARS.businessIndia,
        role: 'subscriber',
        user_type: 'business',
        company_name: 'Apex Home & Digital Services Pvt Ltd',
        vat_number: 'GSTIN29ABCDE1234F1Z5',
        business_address: '100 Feet Road, Indiranagar, Bangalore 560038',
        country_code: 'IND',
        currency_code: 'INR',
        average_rating: 4.97,
        total_feedbacks: 140,
        is_verified: 1,
        kyc_status: 'verified',
        location: {
          name: 'Indiranagar Hub',
          street: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          country: 'India',
          zip_code: '560038',
          latitude: 12.9719,
          longitude: 77.6412
        }
      }
    ];

    const seededUsers = [];

    for (const u of usersToSeed) {
      const [insertUserResult] = await connection.query(`
        INSERT INTO users (
          email, password_hash, full_name, username, phone, avatar,
          role, user_type, company_name, vat_number, business_address,
          country_code, currency_code, average_rating, total_feedbacks,
          is_verified, is_active, kyc_status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, 1, ?, NOW(), NOW()
        )
      `, [
        u.email, defaultPasswordHash, u.full_name, u.username, u.phone, u.avatar,
        u.role, u.user_type, u.company_name || null, u.vat_number || null, u.business_address || null,
        u.country_code, u.currency_code, u.average_rating, u.total_feedbacks,
        u.is_verified, u.kyc_status
      ]);

      const userId = insertUserResult.insertId;

      const [insertLocResult] = await connection.query(`
        INSERT INTO user_locations (
          user_id, name, street, city, country, zip_code,
          latitude, longitude, is_default, is_active, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 1, 1, NOW(), NOW()
        )
      `, [
        userId, u.location.name, u.location.street, u.location.city, u.location.country, u.location.zip_code,
        u.location.latitude, u.location.longitude
      ]);

      seededUsers.push({
        ...u,
        id: userId,
        locationId: insertLocResult.insertId,
        coords: { lat: u.location.latitude, lng: u.location.longitude }
      });
    }

    console.log(`   ✅ Successfully seeded ${seededUsers.length} users with accurate locations!`);

    // =========================================================================
    // STEP 4: Seed Listings (SHORT TITLES + ALL MAIN CATEGORIES)
    // =========================================================================
    console.log('🏷️ 4. Seeding Listings across all categories with Short Titles & High-Res Images...');

    // Category mapping helper
    const [subcatRows] = await connection.query('SELECT id, slug FROM categories WHERE parent_id = 6');
    const subcatMap = {};
    subcatRows.forEach(r => { subcatMap[r.slug] = r.id; });

    const [catRows] = await connection.query('SELECT id, slug FROM categories WHERE parent_id IS NULL');
    const catMap = {};
    catRows.forEach(r => { catMap[r.slug] = r.id; });

    const listings = [
      // =======================================================================
      // CATEGORY 1: ELECTRONICS (Phones, Laptops, Audio, Gaming, Tablets)
      // =======================================================================
      {
        userIndex: 0, // Oliver (London)
        title: 'MacBook Pro 16"',
        description: 'Apple M3 Max chip with 36GB RAM and 1TB SSD. Space Black finish, battery health 99%, original MagSafe charger and packaging included.',
        price: 2450.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['electronics'] || catMap['computers-and-tablets'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.macbook,
        featured: 1,
        views_count: 450,
        trending_score: 98
      },
      {
        userIndex: 11, // Aarav (Delhi)
        title: 'iPhone 15 Pro Max',
        description: '256GB Natural Titanium, AppleCare+ active. 100% battery health, box, invoice, and tempered glass applied.',
        price: 1150.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['phones-and-accessories'] || catMap['electronics'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.iphone,
        featured: 1,
        views_count: 620,
        trending_score: 99
      },
      {
        userIndex: 4, // Mikko (Helsinki)
        title: 'Sony Alpha A7 IV',
        description: 'Full-frame mirrorless camera with FE 24-70mm F2.8 GM lens. Shutter count 4.1k, 2 original Sony batteries and dual charger.',
        price: 2100.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['cameras'] || catMap['electronics'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.sonyCamera,
        featured: 1,
        views_count: 380,
        trending_score: 94
      },
      {
        userIndex: 9, // Max (Berlin)
        title: 'B&O H95 Headphones',
        description: 'Flagship ANC wireless headphones with titanium drivers and customized active noise cancellation. Full aluminium carrying case.',
        price: 580.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['electronics'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.headphones,
        featured: 0,
        views_count: 275,
        trending_score: 87
      },
      {
        userIndex: 0, // Oliver (London)
        title: 'Apple Watch Ultra 2',
        description: '49mm Titanium case with Ocean Band. GPS + Cellular, complete with fast charger and original box.',
        price: 650.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['electronics'] || catMap['phones-and-accessories'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.smartwatch,
        featured: 1,
        views_count: 310,
        trending_score: 89
      },
      {
        userIndex: 3, // George (London)
        title: 'PlayStation 5 Slim',
        description: 'Digital Edition console with 1TB SSD and DualSense wireless controller. Includes charging dock and original cables.',
        price: 420.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['video-games-and-consoles'] || catMap['electronics'] || 1,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.ps5,
        featured: 0,
        views_count: 260,
        trending_score: 84
      },
      {
        userIndex: 7, // Alexandre (Paris)
        title: 'iPad Pro 12.9" M2',
        description: 'Liquid Retina XDR display, 256GB Wi-Fi in Space Gray. Includes Apple Pencil 2 and Smart Folio case.',
        price: 890.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['computers-and-tablets'] || catMap['electronics'] || 1,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.ipad,
        featured: 1,
        views_count: 390,
        trending_score: 91
      },

      // =======================================================================
      // CATEGORY 2: FURNITURE & HOME & GARDEN
      // =======================================================================
      {
        userIndex: 1, // Charlotte (London)
        title: 'Scandinavian Sofa',
        description: 'Mid-century modern 3-seater sofa upholstered in water-repellent emerald velvet with solid oak tapered legs.',
        price: 680.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['furniture-and-decoration'] || catMap['home-garden'] || 3,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.scandiSofa,
        featured: 1,
        views_count: 310,
        trending_score: 88
      },
      {
        userIndex: 5, // Sofia (Helsinki)
        title: 'Solid Oak Dining Table',
        description: 'Handcrafted Finnish oak table (200x95cm) finished in natural Osmo hardwax oil with black steel base. Seats 8.',
        price: 890.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['furniture-and-decoration'] || catMap['home-garden'] || 3,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.diningTable,
        featured: 1,
        views_count: 340,
        trending_score: 92
      },
      {
        userIndex: 7, // Alexandre (Paris)
        title: 'Velvet Lounge Armchair',
        description: 'Ergonomic accent armchair in warm mustard velvet with matte black metal frame. Ideal for living room or reading corner.',
        price: 320.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['furniture-and-decoration'] || 3,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.armchair,
        featured: 0,
        views_count: 180,
        trending_score: 78
      },
      {
        userIndex: 9, // Max (Berlin)
        title: 'Marble Coffee Table',
        description: 'Round white Carrara marble coffee table with geometric brass frame (80cm diameter).',
        price: 280.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['furniture-and-decoration'] || 3,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.coffeeTable,
        featured: 0,
        views_count: 195,
        trending_score: 80
      },
      {
        userIndex: 1, // Charlotte (London)
        title: 'Modern Floor Lamp',
        description: 'Minimalist arc floor lamp with brushed brass finish and dimmable warm LED bulb included.',
        price: 140.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['home-garden'] || catMap['furniture-and-decoration'] || 3,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.floorLamp,
        featured: 0,
        views_count: 150,
        trending_score: 72
      },

      // =======================================================================
      // CATEGORY 3: FASHION, WATCHES & ACCESSORIES
      // =======================================================================
      {
        userIndex: 12, // Priya (Mumbai)
        title: 'Swiss Automatic Watch',
        description: 'Automatic chronograph with exhibition caseback, ceramic bezel, 42mm case and stainless steel bracelet with box & papers.',
        price: 950.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['watches-jewellery'] || catMap['fashion'] || 2,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.luxuryWatch,
        featured: 1,
        views_count: 480,
        trending_score: 93
      },
      {
        userIndex: 7, // Alexandre (Paris)
        title: 'Leather Biker Jacket',
        description: 'Premium lambskin leather motorcycle jacket in matte black. Size Medium (Euro 48), YKK silver hardware.',
        price: 240.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['clothing-and-shoes'] || catMap['fashion'] || 2,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.leatherJacket,
        featured: 0,
        views_count: 210,
        trending_score: 81
      },
      {
        userIndex: 3, // George (London)
        title: 'Nike Air Jordan 1',
        description: 'Retro High OG in iconic colorway. Size UK 9 / US 10 / EU 44. Worn once with original box and extra laces.',
        price: 180.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['clothing-and-shoes'] || catMap['fashion'] || 2,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.sneakers,
        featured: 0,
        views_count: 290,
        trending_score: 85
      },
      {
        userIndex: 1, // Charlotte (London)
        title: 'Classic Trench Coat',
        description: 'Double-breasted cotton gabardine trench coat with storm flap and buckled belt. Size UK 10 / EU 38.',
        price: 320.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['clothing-and-shoes'] || catMap['fashion'] || 2,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.trenchCoat,
        featured: 0,
        views_count: 170,
        trending_score: 76
      },

      // =======================================================================
      // CATEGORY 4: VEHICLES, CARS, MOTORBIKES & BICYCLES
      // =======================================================================
      {
        userIndex: 7, // Alexandre (Paris)
        title: 'Vespa Primavera 125cc',
        description: '2023 ABS model in Grigio Materia, 3,200 km. Garaged in indoor parking with full dealer service history.',
        price: 3400.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['car'] || catMap['vehicles'] || 4,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.vintageVespa,
        featured: 1,
        views_count: 512,
        trending_score: 97
      },
      {
        userIndex: 3, // George (London)
        title: 'Canyon Gravel Bike',
        description: 'Grizl CF SL 8 Carbon frame (Size Medium) with Shimano GRX RX810 groupset and tubeless DT Swiss wheels.',
        price: 1850.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['bicycles-cycling'] || catMap['sports-hobbies'] || 8,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.gravelBike,
        featured: 1,
        views_count: 320,
        trending_score: 88
      },
      {
        userIndex: 9, // Max (Berlin)
        title: 'VanMoof S3 Electric Bike',
        description: 'Smart urban e-bike with automatic electronic gear shifting, integrated anti-theft tracking, and hydraulic brakes.',
        price: 1200.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['bicycles-cycling'] || 8,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.electricBike,
        featured: 0,
        views_count: 240,
        trending_score: 83
      },
      {
        userIndex: 0, // Oliver (London)
        title: 'Brompton Folding Bike',
        description: 'C Line Explore 6-speed folding bicycle in Racing Green. Lightweight and compact commuter bike with front carrier block.',
        price: 1100.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['bicycles-cycling'] || 8,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.foldingBike,
        featured: 0,
        views_count: 280,
        trending_score: 86
      },

      // =======================================================================
      // CATEGORY 5: SPORTS, MUSIC & HOBBIES
      // =======================================================================
      {
        userIndex: 3, // George (London)
        title: 'Fender Stratocaster Guitar',
        description: 'American Performer Stratocaster in Sunburst with Maple neck and Yosemite single-coil pickups. Includes Fender gig bag.',
        price: 850.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['music-and-instruments'] || catMap['entertainment-and-hobbies'] || 8,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.electricGuitar,
        featured: 1,
        views_count: 360,
        trending_score: 90
      },
      {
        userIndex: 9, // Max (Berlin)
        title: 'Pioneer DJ Controller',
        description: 'DDJ-FLX6 4-channel DJ controller compatible with Rekordbox and Serato DJ Pro. Mint condition in original packaging.',
        price: 550.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['music-and-instruments'] || 8,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.djController,
        featured: 0,
        views_count: 230,
        trending_score: 82
      },
      {
        userIndex: 4, // Mikko (Helsinki)
        title: 'Wilson Tennis Racket',
        description: 'Pro Staff 97 v14 performance racket (Grip Size 3 / 4 3/8). Strung with Luxilon ALU Power at 52 lbs.',
        price: 160.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['sports-and-accessories'] || 8,
        subcategory_id: null,
        condition_id: 1,
        images: IMAGES.tennisRacket,
        featured: 0,
        views_count: 140,
        trending_score: 70
      },
      {
        userIndex: 5, // Sofia (Helsinki)
        title: 'Camping Dome Tent 4P',
        description: 'MSR 4-person all-weather camping tent with aluminum poles and 3000mm waterproof rainfly. Compact packed size.',
        price: 190.00,
        listing_type: 'product',
        activity_id: 2, // Sell
        category_id: catMap['sports-and-accessories'] || 8,
        subcategory_id: null,
        condition_id: 2,
        images: IMAGES.campingTent,
        featured: 0,
        views_count: 165,
        trending_score: 74
      },

      // =======================================================================
      // CATEGORY 6: SERVICES (14 DISTINCT SHORT-TITLED SERVICES)
      // =======================================================================
      {
        userIndex: 6, // Nordic Clean & Craft Solutions Oy (Business - Espoo/Helsinki)
        title: 'Home Deep Cleaning',
        description: 'Eco-friendly residential, move-out, and office deep cleaning with Nordic quality standards and 100% satisfaction guarantee.',
        price: 38.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['house-cleaning'] || null,
        condition_id: null,
        images: IMAGES.houseCleaning,
        featured: 1,
        views_count: 650,
        trending_score: 99
      },
      {
        userIndex: 2, // Westminster Services (Business - London)
        title: 'Emergency Plumbing',
        description: 'Gas Safe registered emergency plumbers. Rapid 45-minute response for burst pipes, boilers, radiators, and drains.',
        price: 85.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['plumbing-repairs'] || null,
        condition_id: null,
        images: IMAGES.plumbing,
        featured: 1,
        views_count: 490,
        trending_score: 94
      },
      {
        userIndex: 2, // Westminster Services (Business - London)
        title: 'Master Electrician',
        description: 'NICEIC-certified electrical contractors for complete house rewiring, EV charge points, fuse boards, and smart lighting.',
        price: 65.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['electrical-services'] || null,
        condition_id: null,
        images: IMAGES.electrician,
        featured: 1,
        views_count: 580,
        trending_score: 98
      },
      {
        userIndex: 8, // Atelier Artisanal Déco (Business - Paris)
        title: 'Interior Painting',
        description: 'Professional interior and exterior painting, plaster smoothing, and bespoke wallpapering. Free quote within 24h.',
        price: 55.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['painting-decorating'] || null,
        condition_id: null,
        images: IMAGES.painting,
        featured: 1,
        views_count: 420,
        trending_score: 93
      },
      {
        userIndex: 10, // München Tech Works (Business - Munich)
        title: 'Handyman & Assembly',
        description: 'Skilled handyman services for furniture assembly (IKEA/PAX), TV mounting, door fixings, and general house repairs.',
        price: 45.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['handyman-services'] || null,
        condition_id: null,
        images: IMAGES.handyman,
        featured: 0,
        views_count: 310,
        trending_score: 86
      },
      {
        userIndex: 1, // Charlotte (London)
        title: 'Garden & Lawn Care',
        description: 'Full garden maintenance, lawn mowing, hedge trimming, seasonal planting, and high-pressure patio jet washing.',
        price: 35.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['lawn-garden-care'] || null,
        condition_id: null,
        images: IMAGES.gardening,
        featured: 0,
        views_count: 220,
        trending_score: 81
      },
      {
        userIndex: 6, // Nordic Clean & Craft (Business - Espoo)
        title: 'Custom Wood Carpentry',
        description: 'Master timber craftsmanship for custom shelving, built-in wardrobes, kitchen fittings, and terrace decking.',
        price: 52.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['carpentry-furniture'] || null,
        condition_id: null,
        images: IMAGES.carpentry,
        featured: 1,
        views_count: 380,
        trending_score: 91
      },
      {
        userIndex: 13, // Apex Solutions (Business - Bangalore)
        title: 'Movers & Van Transport',
        description: 'Reliable household and office relocation with protective packing, dedicated van transport, and careful loading.',
        price: 90.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['moving-logistics'] || null,
        condition_id: null,
        images: IMAGES.moving,
        featured: 1,
        views_count: 510,
        trending_score: 94
      },
      {
        userIndex: 13, // Apex Solutions (Business - Bangalore)
        title: 'Mac & PC Tech Repair',
        description: 'Expert component-level hardware repair, SSD/RAM upgrades, screen replacements, and virus/data recovery.',
        price: 50.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['it-device-repair'] || null,
        condition_id: null,
        images: IMAGES.techRepair,
        featured: 1,
        views_count: 780,
        trending_score: 99
      },
      {
        userIndex: 8, // Atelier Artisanal (Business - Paris)
        title: 'Portrait Photography',
        description: 'Editorial portrait, corporate headshots, weddings, and architecture photography with full post-production included.',
        price: 120.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['photography-videography'] || null,
        condition_id: null,
        images: IMAGES.photography,
        featured: 0,
        views_count: 310,
        trending_score: 86
      },
      {
        userIndex: 5, // Sofia (Helsinki)
        title: 'Dog Walking & Sitting',
        description: 'Reliable daily 45-min dog walks, positive training reinforcement, and overnight loving pet sitting in central Helsinki.',
        price: 22.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['pet-care-walking'] || null,
        condition_id: null,
        images: IMAGES.petCare,
        featured: 0,
        views_count: 195,
        trending_score: 79
      },
      {
        userIndex: 10, // München Works (Business - Munich)
        title: 'Mobile Car Detailing',
        description: 'Premium mobile auto wash, interior steam cleaning, leather restoration, and multi-stage ceramic coating.',
        price: 79.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['auto-detailing'] || null,
        condition_id: null,
        images: IMAGES.carDetailing,
        featured: 0,
        views_count: 360,
        trending_score: 89
      },
      {
        userIndex: 12, // Priya (Mumbai)
        title: 'Personal Yoga Coach',
        description: '1-on-1 personalized yoga, breathwork, posture alignment, and functional fitness coaching in-home or online.',
        price: 60.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['fitness-yoga'] || null,
        condition_id: null,
        images: IMAGES.fitnessTraining,
        featured: 0,
        views_count: 290,
        trending_score: 83
      },
      {
        userIndex: 2, // Westminster Services (London)
        title: 'Roof & Gutter Repair',
        description: 'Tile replacement, chimney flashing, leak prevention, and comprehensive vacuum gutter clearing.',
        price: 75.00,
        listing_type: 'service',
        activity_id: 4, // Services
        category_id: 6, // Services
        subcategory_id: subcatMap['roof-fixing'] || null,
        condition_id: null,
        images: IMAGES.roofing,
        featured: 0,
        views_count: 210,
        trending_score: 77
      }
    ];

    let adCount = 0;
    for (const item of listings) {
      const user = seededUsers[item.userIndex];
      const itemCode = 'RB-' + Math.floor(100000 + Math.random() * 900000);

      const [adResult] = await connection.query(`
        INSERT INTO advertisements (
          item_code, user_id, advertisement_plan_id, title, description, images,
          category_id, subcategory_id, location_id, price, display_duration_days,
          activity_id, condition_id, status, views_count, featured, start_date, end_date,
          trending_score, gender_target, listing_type, created_at, updated_at
        ) VALUES (
          ?, ?, 1, ?, ?, ?,
          ?, ?, ?, ?, 365,
          ?, ?, 'published', ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY),
          ?, 'all', ?, NOW(), NOW()
        )
      `, [
        itemCode,
        user.id,
        item.title,
        item.description,
        JSON.stringify(item.images),
        item.category_id,
        item.subcategory_id,
        user.locationId,
        item.price,
        item.activity_id,
        item.condition_id,
        item.views_count,
        item.featured,
        item.trending_score,
        item.listing_type
      ]);

      const adId = adResult.insertId;

      // Link in advertisement_locations table
      await connection.query(`
        INSERT INTO advertisement_locations (advertisement_id, location_id, created_at)
        VALUES (?, ?, NOW())
      `, [adId, user.locationId]);

      // Add promotional / visibility badge for featured items
      if (item.featured) {
        await connection.query(`
          INSERT INTO product_badges (
            advertisement_id, badge_type, badge_level, is_active,
            expiry_date, created_at, updated_at
          ) VALUES (
            ?, 'visibility', 'show_casing', 1,
            DATE_ADD(NOW(), INTERVAL 90 DAY), NOW(), NOW()
          )
        `, [adId]);
      }

      adCount++;
    }

    console.log(`   ✅ Successfully seeded ${adCount} listings with short titles and high-res images!`);

    await connection.commit();
    console.log('\n🎉 ALL REAL-WORLD DATA SEEDED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('✅ Services Categories: Manageable from Admin Panel');
    console.log(`✅ Users Seeded: ${seededUsers.length} (UK, Finland, France, Germany, India)`);
    console.log(`✅ Business Users with VAT & KYC: 5 verified corporate profiles`);
    console.log(`✅ Listings: ${adCount} (Sell Products + Services) with Short Titles`);
    console.log('---------------------------------------------------------\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding failed with error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Execute
seedRealWorldData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
