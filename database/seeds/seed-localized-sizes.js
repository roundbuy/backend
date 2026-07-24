const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function run() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roundbuy',
    });

    console.log('Database connected successfully.');

    // Clear existing sizes to start fresh
    console.log('Clearing existing ad_sizes...');
    await connection.query('DELETE FROM ad_sizes');

    // Fetch gender IDs from database
    const [genders] = await connection.query("SELECT id, slug FROM ad_genders");
    const maleId = genders.find(g => g.slug === 'male')?.id || 1;
    const femaleId = genders.find(g => g.slug === 'female')?.id || 2;
    const otherId = genders.find(g => g.slug === 'other')?.id || 3;

    console.log(`Gender IDs loaded - Male: ${maleId}, Female: ${femaleId}, Other (Unisex/Kids): ${otherId}`);

    const sizesToInsert = [];
    let sortOrder = 1;

    // ----------------------------------------------------
    // 1. Women's Clothing Sizes (Vinted PDF & Screenshot)
    // ----------------------------------------------------
    const womensClothing = [
      { intl: 'XXXS', us: '00', uk: '0', fr: '30', it: '34', jp: null },
      { intl: 'XXS', us: '0', uk: '2', fr: '32', it: '36', jp: null },
      { intl: 'XS', us: '2', uk: '4-6', fr: '34', it: '38', jp: null },
      { intl: 'S', us: '4-6', uk: '8-10', fr: '36-38', it: '40-42', jp: '1' },
      { intl: 'M', us: '8-10', uk: '12-14', fr: '40-42', it: '44-46', jp: '2' },
      { intl: 'L', us: '12-14', uk: '16-18', fr: '44-46', it: '48-50', jp: '3' },
      { intl: 'XL', us: '16-18', uk: '20-22', fr: '48-50', it: '52-54', jp: '4' },
      { intl: 'XXL', us: '20-22', uk: '24-26', fr: '52-54', it: '56-58', jp: '5' },
      { intl: 'XXXL', us: '24-26', uk: '28-30', fr: '56-58', it: '60-62', jp: null },
      { intl: '4XL', us: '28-30', uk: '32-34', fr: '60-62', it: '64-66', jp: null },
      { intl: '5XL', us: '32-34', uk: '36-38', fr: '64-66', it: '68-70', jp: null },
      { intl: '6XL', us: '36-38', uk: '40-42', fr: '68-70', it: '72-74', jp: null },
      { intl: '7XL', us: '40-42', uk: '44-46', fr: '72-74', it: '76-78', jp: null },
      { intl: '8XL', us: '44-46', uk: '48-50', fr: '76-78', it: '80-82', jp: null },
      { intl: '9XL', us: '48', uk: '52', fr: '80', it: '84', jp: null }
    ];

    womensClothing.forEach(item => {
      sizesToInsert.push({
        name: `Women Clothing ${item.intl}`,
        slug: `women-clothing-${item.intl.toLowerCase()}`,
        gender_id: femaleId,
        intl_size: item.intl,
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.fr, // EU matches FR for clothing
        fr_size: item.fr,
        it_size: item.it,
        jp_size: item.jp,
        size_category: 'clothing',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 2. Women's Jeans Sizes (Vinted Jeans PDF)
    // ----------------------------------------------------
    const womensJeans = [
      { label: 'W23-24', intl: 'XXXS', us: '00', uk: '0', fr: '30', it: '34', jp: null },
      { label: 'W24-25', intl: 'XXS', us: '0', uk: '2', fr: '32', it: '36', jp: null },
      { label: 'W25-26', intl: 'XS', us: '2', uk: '4-6', fr: '34', it: '38', jp: null },
      { label: 'W27-28', intl: 'S', us: '4-6', uk: '8-10', fr: '36-38', it: '40-42', jp: '1' },
      { label: 'W29-30', intl: 'M', us: '8-10', uk: '12-14', fr: '40-42', it: '44-46', jp: '2' },
      { label: 'W31-32', intl: 'L', us: '12-14', uk: '16-18', fr: '44-46', it: '48-50', jp: '3' },
      { label: 'W33-34', intl: 'XL', us: '16-18', uk: '20-22', fr: '48-50', it: '52-54', jp: '4' },
      { label: 'W35-36', intl: 'XXL', us: '20-22', uk: '24-26', fr: '52-54', it: '56-58', jp: '5' },
      { label: 'W37-38', intl: 'XXXL', us: '24-26', uk: '28-30', fr: '56-58', it: '60-62', jp: null },
      { label: 'W39-40', intl: '4XL', us: '28-30', uk: '32-34', fr: '60-62', it: '64-66', jp: null },
      { label: 'W41-42', intl: '5XL', us: '32-34', uk: '36-38', fr: '64-66', it: '68-70', jp: null },
      { label: 'W43-44', intl: '6XL', us: '36-38', uk: '40-42', fr: '68-70', it: '72-74', jp: null },
      { label: 'W45-46', intl: '7XL', us: '40-42', uk: '44-46', fr: '72-74', it: '76-78', jp: null },
      { label: 'W47-48', intl: '8XL', us: '44-46', uk: '48-50', fr: '76-78', it: '80-82', jp: null },
      { label: 'W49-50', intl: '9XL', us: '48', uk: '52', fr: '80', it: '84', jp: null }
    ];

    womensJeans.forEach(item => {
      sizesToInsert.push({
        name: `Women Jeans ${item.label}`,
        slug: `women-jeans-${item.label.toLowerCase()}`,
        gender_id: femaleId,
        intl_size: item.label, // Show waist label as primary
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.fr,
        fr_size: item.fr,
        it_size: item.it,
        jp_size: item.jp,
        size_category: 'jeans',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 3. Men's Clothing Sizes (Vinted PDF & Screenshot IT/US/JP)
    // ----------------------------------------------------
    const mensClothing = [
      { intl: 'XS', us: '34', uk: '34', fr: '44', it: '44', jp: null, chest: '30-32"' },
      { intl: 'S', us: '36', uk: '36', fr: '46', it: '46', jp: '1', chest: '32-34"' },
      { intl: 'M', us: '38', uk: '38', fr: '48', it: '48', jp: '2', chest: '35-37"' },
      { intl: 'L', us: '40', uk: '40', fr: '50', it: '50', jp: '3', chest: '37-40"' },
      { intl: 'XL', us: '42', uk: '42', fr: '52', it: '52', jp: '4', chest: '40-42"' },
      { intl: 'XXL', us: '44', uk: '44', fr: '54', it: '54', jp: '5', chest: '43-46"' },
      { intl: '3XL', us: '46', uk: '46', fr: '56', it: '56', jp: '6', chest: '46-50"' },
      { intl: '4XL', us: '48', uk: '48', fr: '58', it: '58', jp: '7', chest: '50-52"' },
      { intl: '5XL', us: '50', uk: '50', fr: '60', it: '60', jp: '8', chest: '53-57"' },
      { intl: '6XL', us: '52', uk: '52', fr: '62', it: '62', jp: '9', chest: '57-60"' },
      { intl: '7XL', us: '54', uk: '54', fr: '64', it: '64', jp: '10', chest: '61-64"' },
      { intl: '8XL', us: '56', uk: '56', fr: '66', it: '66', jp: '11', chest: '65-66"' }
    ];

    mensClothing.forEach(item => {
      sizesToInsert.push({
        name: `Men Clothing ${item.intl}`,
        slug: `men-clothing-${item.intl.toLowerCase()}`,
        gender_id: maleId,
        intl_size: item.intl,
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.fr,
        fr_size: item.fr,
        it_size: item.it,
        jp_size: item.jp,
        size_category: 'clothing',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 4. Kids & Babies' Clothing Sizes (Vinted PDF)
    // ----------------------------------------------------
    const kidsClothing = [
      { us: 'Preemie', uk: 'Preemie', eu: 'Up to 44', height: 'Up to 17"' },
      { us: 'Newborn', uk: 'Newborns', eu: '44', height: '17-19.25"' },
      { us: '1M', uk: 'Up to 1 month', eu: '50', height: '19.5-21.75"' },
      { us: '1-3M', uk: '1-3 months', eu: '56', height: '22-24"' },
      { us: '3-6M', uk: '3-6 months', eu: '62', height: '24.25-26.5"' },
      { us: '6-9M', uk: '6-9 months', eu: '68', height: '26.75-28.75"' },
      { us: '9-12M', uk: '9-12 months', eu: '74', height: '29-31"' },
      { us: '12-18M', uk: '12-18 months', eu: '80', height: '31.25-33.5"' },
      { us: '24M | 2T/2', uk: '18-24 months', eu: '86', height: '33.5-35.5"' },
      { us: '36M', uk: '2 years', eu: '92', height: '36-38"' },
      { us: '3T/3', uk: '3 years', eu: '98', height: '38.5-40.75"' },
      { us: '4T/4', uk: '4 years', eu: '104', height: '41-43"' },
      { us: '5T', uk: '5 years', eu: '110', height: '43.25-45.3"' },
      { us: '6', uk: '6 years', eu: '116', height: '45.5-47.5"' },
      { us: '6X | 7', uk: '7 years', eu: '122', height: '48-50"' },
      { us: '8', uk: '8 years', eu: '128', height: '50.5-52.5"' },
      { us: '9', uk: '9 years', eu: '134', height: '52.75-54.75"' },
      { us: '10', uk: '10 years', eu: '140', height: '55-57"' },
      { us: '11', uk: '11 years', eu: '146', height: '57.5-59.5"' },
      { us: '12', uk: '12 years', eu: '152', height: '59.75-61.75"' },
      { us: '14', uk: '13 years', eu: '158', height: '62-65"' },
      { us: '16', uk: '14 years', eu: '164', height: '64.5-66.5"' },
      { us: '18', uk: '15 years', eu: '170', height: '67-69"' },
      { us: '20', uk: '16 years', eu: '176', height: '69-71"' }
    ];

    kidsClothing.forEach(item => {
      // Make a clean slug
      const cleanSlug = item.us.replace(/\s+/g, '-').replace(/\|/g, '-').replace(/\//g, '-').toLowerCase();
      sizesToInsert.push({
        name: `Kids Clothing ${item.us}`,
        slug: `kids-clothing-${cleanSlug}`,
        gender_id: otherId,
        intl_size: item.us,
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.eu,
        fr_size: item.eu,
        it_size: item.eu,
        jp_size: null,
        size_category: 'kids_clothing',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 5. Women's Shoe Sizes (Screenshot)
    // ----------------------------------------------------
    const womensShoes = [
      { eu: '36', uk: '3', us: '6', jp: '23' },
      { eu: '36.5', uk: '3.5', us: '6.5', jp: '23.5' },
      { eu: '37', uk: '4', us: '7', jp: '24' },
      { eu: '37.5', uk: '4.5', us: '7.5', jp: '24.5' },
      { eu: '38', uk: '5', us: '8', jp: '25' },
      { eu: '38.5', uk: '5.5', us: '8.5', jp: null },
      { eu: '39', uk: '6', us: '9', jp: '25.5' },
      { eu: '39.5', uk: '6.5', us: '9.5', jp: null },
      { eu: '40', uk: '7', us: '10', jp: '26' },
      { eu: '40.5', uk: '7.5', us: '10.5', jp: null },
      { eu: '41', uk: '8', us: '11', jp: '27' }
    ];

    womensShoes.forEach(item => {
      sizesToInsert.push({
        name: `Women Shoe ${item.eu}`,
        slug: `women-shoe-${item.eu.replace('.', '-')}`,
        gender_id: femaleId,
        intl_size: item.eu, // EU size is standard for shoes
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.eu,
        fr_size: item.eu,
        it_size: item.eu,
        jp_size: item.jp,
        size_category: 'shoes',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 6. Men's Shoe Sizes (Screenshot)
    // ----------------------------------------------------
    const mensShoes = [
      { eu: '40', uk: '6', us: '7', jp: '25' },
      { eu: '40.5', uk: '6.5', us: '7.5', jp: '25.5' },
      { eu: '41', uk: '7', us: '8', jp: '26' },
      { eu: '41.5', uk: '7.5', us: '8.5', jp: '26.5' },
      { eu: '42', uk: '8', us: '9', jp: '27' },
      { eu: '42.5', uk: '8.5', us: '9.5', jp: '27.5' },
      { eu: '43', uk: '9', us: '10', jp: '28' },
      { eu: '43.5', uk: '9.5', us: '10.5', jp: '28.5' },
      { eu: '44', uk: '10', us: '11', jp: '29' },
      { eu: '44.5', uk: '10.5', us: '11.5', jp: '29.5' },
      { eu: '45', uk: '11', us: '12', jp: '30' },
      { eu: '45.5', uk: '11.5', us: '12.5', jp: '30.5' },
      { eu: '46', uk: '12', us: '13', jp: '31' }
    ];

    mensShoes.forEach(item => {
      sizesToInsert.push({
        name: `Men Shoe ${item.eu}`,
        slug: `men-shoe-${item.eu.replace('.', '-')}`,
        gender_id: maleId,
        intl_size: item.eu,
        us_size: item.us,
        uk_size: item.uk,
        euro_size: item.eu,
        fr_size: item.eu,
        it_size: item.eu,
        jp_size: item.jp,
        size_category: 'shoes',
        sort_order: sortOrder++
      });
    });

    // ----------------------------------------------------
    // 7. Belt Sizes (Screenshot)
    // ----------------------------------------------------
    const belts = [
      { intl: 'XS', in: '30', cm: '75' },
      { intl: 'S', in: '32', cm: '80' },
      { intl: 'M', in: '34', cm: '85' },
      { intl: 'L', in: '36', cm: '90' },
      { intl: 'XL', in: '38', cm: '95' },
      { intl: 'XXL', in: '40', cm: '100' },
      { intl: 'XXXL', in: '42', cm: '105' }
    ];

    belts.forEach(item => {
      sizesToInsert.push({
        name: `Belt ${item.intl}`,
        slug: `belt-${item.intl.toLowerCase()}`,
        gender_id: otherId, // Belts can be unisex
        intl_size: item.intl,
        us_size: item.in,
        uk_size: item.in,
        euro_size: item.cm,
        fr_size: item.cm,
        it_size: item.cm,
        jp_size: null,
        size_category: 'belts',
        sort_order: sortOrder++
      });
    });

    console.log(`Inserting ${sizesToInsert.length} size records into ad_sizes...`);
    
    // Batch insert size records
    const query = `
      INSERT INTO ad_sizes (
        name, slug, gender_id, intl_size, us_size, uk_size, euro_size, fr_size, it_size, jp_size, size_category, sort_order
      ) VALUES ?
    `;

    const values = sizesToInsert.map(s => [
      s.name, s.slug, s.gender_id, s.intl_size, s.us_size, s.uk_size, s.euro_size, s.fr_size, s.it_size, s.jp_size, s.size_category, s.sort_order
    ]);

    await connection.query(query, [values]);

    console.log('✅ Localized sizes seeded successfully!');

    // Show stats
    console.log(`- Clothing sizes: ${sizesToInsert.filter(s => s.size_category === 'clothing').length}`);
    console.log(`- Jeans sizes: ${sizesToInsert.filter(s => s.size_category === 'jeans').length}`);
    console.log(`- Kids clothing: ${sizesToInsert.filter(s => s.size_category === 'kids_clothing').length}`);
    console.log(`- Shoe sizes: ${sizesToInsert.filter(s => s.size_category === 'shoes').length}`);
    console.log(`- Belt sizes: ${sizesToInsert.filter(s => s.size_category === 'belts').length}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

run();
