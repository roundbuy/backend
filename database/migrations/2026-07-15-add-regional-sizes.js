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

    // 1. Add regional size columns if they do not exist
    console.log('Adding regional columns if not existing...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM ad_sizes LIKE 'us_size'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE ad_sizes
        ADD COLUMN us_size VARCHAR(50) DEFAULT NULL AFTER name,
        ADD COLUMN uk_size VARCHAR(50) DEFAULT NULL AFTER us_size,
        ADD COLUMN euro_size VARCHAR(50) DEFAULT NULL AFTER uk_size,
        ADD COLUMN intl_size VARCHAR(50) DEFAULT NULL AFTER euro_size
      `);
      console.log('Columns added successfully.');
    } else {
      console.log('Columns already exist. Skipping ALTER.');
    }

    // 2. Update existing sizes with regional values
    const sizeMappings = [
      {
        slug: 'men-xs',
        us_size: 'XS (32-34")',
        uk_size: 'XS (32-34")',
        euro_size: '42-44',
        intl_size: 'XS'
      },
      {
        slug: 'men-s',
        us_size: 'S (34-36")',
        uk_size: 'S (34-36")',
        euro_size: '44-46',
        intl_size: 'S'
      },
      {
        slug: 'men-m',
        us_size: 'M (38-40")',
        uk_size: 'M (38-40")',
        euro_size: '48-50',
        intl_size: 'M'
      },
      {
        slug: 'men-l',
        us_size: 'L (42-44")',
        uk_size: 'L (42-44")',
        euro_size: '52-54',
        intl_size: 'L'
      },
      {
        slug: 'men-xl',
        us_size: 'XL (46-48")',
        uk_size: 'XL (46-48")',
        euro_size: '56-58',
        intl_size: 'XL'
      },
      {
        slug: 'men-xxl',
        us_size: 'XXL (50-52")',
        uk_size: 'XXL (50-52")',
        euro_size: '60-62',
        intl_size: 'XXL'
      },
      {
        slug: 'women-xs',
        us_size: '0-2 (XS)',
        uk_size: '4-6',
        euro_size: '32-34',
        intl_size: 'XS'
      },
      {
        slug: 'women-s',
        us_size: '4-6 (S)',
        uk_size: '8-10',
        euro_size: '36-38',
        intl_size: 'S'
      },
      {
        slug: 'women-m',
        us_size: '8-10 (M)',
        uk_size: '12-14',
        euro_size: '40-42',
        intl_size: 'M'
      },
      {
        slug: 'women-l',
        us_size: '12-14 (L)',
        uk_size: '16-18',
        euro_size: '44-46',
        intl_size: 'L'
      },
      {
        slug: 'women-xl',
        us_size: '16-18 (XL)',
        uk_size: '20-22',
        euro_size: '48-50',
        intl_size: 'XL'
      },
      {
        slug: 'women-xxl',
        us_size: '20-22 (XXL)',
        uk_size: '24-26',
        euro_size: '52-54',
        intl_size: 'XXL'
      },
      {
        slug: 'children-xs',
        us_size: '2T-3T',
        uk_size: '2-3 yrs',
        euro_size: '92-98',
        intl_size: 'XS'
      },
      {
        slug: 'children-s',
        us_size: '4T-5',
        uk_size: '4-5 yrs',
        euro_size: '104-110',
        intl_size: 'S'
      },
      {
        slug: 'children-m',
        us_size: '6-7',
        uk_size: '6-7 yrs',
        euro_size: '116-122',
        intl_size: 'M'
      },
      {
        slug: 'children-l',
        us_size: '8-9',
        uk_size: '8-9 yrs',
        euro_size: '128-134',
        intl_size: 'L'
      },
      {
        slug: 'children-xl',
        us_size: '10-12',
        uk_size: '10-12 yrs',
        euro_size: '140-152',
        intl_size: 'XL'
      }
    ];

    console.log('Seeding regional sizes data...');
    for (const mapping of sizeMappings) {
      await connection.query(`
        UPDATE ad_sizes
        SET us_size = ?, uk_size = ?, euro_size = ?, intl_size = ?
        WHERE slug = ?
      `, [mapping.us_size, mapping.uk_size, mapping.euro_size, mapping.intl_size, mapping.slug]);
    }

    console.log('✅ Sizing standards migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

run();
