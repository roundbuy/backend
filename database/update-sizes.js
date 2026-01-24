const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSizes() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy',
            multipleStatements: true
        });

        console.log('Connected to database');

        // Get gender IDs
        const [genders] = await connection.query("SELECT id, slug FROM ad_genders");
        const maleId = genders.find(g => g.slug === 'male')?.id;
        const femaleId = genders.find(g => g.slug === 'female')?.id;
        const otherId = genders.find(g => g.slug === 'other')?.id;

        console.log(`Gender IDs: Male=${maleId}, Female=${femaleId}, Other=${otherId}`);

        // Clear existing sizes
        await connection.query('DELETE FROM ad_sizes');
        console.log('Cleared existing sizes');

        // Insert new sizes with static names
        const sizes = [
            // Men's sizes
            ['Men XS', 'men-xs', maleId, 1],
            ['Men S', 'men-s', maleId, 2],
            ['Men M', 'men-m', maleId, 3],
            ['Men L', 'men-l', maleId, 4],
            ['Men XL', 'men-xl', maleId, 5],
            ['Men XXL', 'men-xxl', maleId, 6],
            // Women's sizes
            ['Women XS', 'women-xs', femaleId, 7],
            ['Women S', 'women-s', femaleId, 8],
            ['Women M', 'women-m', femaleId, 9],
            ['Women L', 'women-l', femaleId, 10],
            ['Women XL', 'women-xl', femaleId, 11],
            ['Women XXL', 'women-xxl', femaleId, 12],
            // Children's sizes
            ['Children XS', 'children-xs', otherId, 13],
            ['Children S', 'children-s', otherId, 14],
            ['Children M', 'children-m', otherId, 15],
            ['Children L', 'children-l', otherId, 16],
            ['Children XL', 'children-xl', otherId, 17],
        ];

        await connection.query(
            'INSERT INTO ad_sizes (name, slug, gender_id, sort_order) VALUES ?',
            [sizes]
        );

        console.log('✅ Sizes updated successfully!');
        console.log('\nInserted sizes:');
        console.log(`- ${sizes.filter(s => s[2] === maleId).length} Men's sizes`);
        console.log(`- ${sizes.filter(s => s[2] === femaleId).length} Women's sizes`);
        console.log(`- ${sizes.filter(s => s[2] === otherId).length} Children's sizes`);

        // Verify
        const [result] = await connection.query(`
      SELECT s.name, g.name as gender_name 
      FROM ad_sizes s 
      LEFT JOIN ad_genders g ON s.gender_id = g.id 
      ORDER BY s.sort_order
    `);

        console.log('\nVerification - First 5 sizes:');
        result.slice(0, 5).forEach(s => {
            console.log(`  - ${s.name} (Gender: ${s.gender_name})`);
        });

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
}

updateSizes();
