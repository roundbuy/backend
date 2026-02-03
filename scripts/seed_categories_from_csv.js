const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { promisePool } = require('../src/config/database');

const CSV_PATH = path.join(__dirname, '../../mobile-app/gd_placecategory_2601261115_34df7593.csv');

async function seedCategories() {
    const categories = [];

    console.log('Reading CSV file from:', CSV_PATH);

    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV file not found at:', CSV_PATH);
        process.exit(1);
    }

    // 1. Read CSV
    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (data) => categories.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Found ${categories.length} categories.`);

    // Helper to decode HTML entities
    const decodeHtml = (str) => {
        if (!str) return str;
        return str.replace(/&amp;/g, '&');
    };

    try {
        // 2. Insert all categories first (flat, no parent)
        console.log('Inserting categories...');
        let insertedCount = 0;

        // Process in batches (optional, but good for logs) or just sequentially
        for (const cat of categories) {
            const name = decodeHtml(cat.cat_name);
            const slug = cat.cat_slug;

            // Skip if required fields are missing
            if (!name || !slug) {
                console.warn('Skipping invalid row:', cat);
                continue;
            }

            // Using INSERT ... ON DUPLICATE KEY UPDATE to handle re-runs
            await promisePool.query(
                `INSERT INTO categories (name, slug, is_active) 
         VALUES (?, ?, TRUE) 
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                [name, slug]
            );
            insertedCount++;
        }
        console.log(`Processed ${insertedCount} categories (inserted or updated).`);

        // 3. Update parent relationships
        console.log('Updating parent relationships...');
        let updatedParentsCount = 0;

        for (const cat of categories) {
            if (!cat.cat_parent) continue;

            const childSlug = cat.cat_slug;
            const parentName = decodeHtml(cat.cat_parent);

            // Find parent ID by name
            const [parents] = await promisePool.query(
                'SELECT id FROM categories WHERE name = ?',
                [parentName]
            );

            if (parents.length > 0) {
                const parentId = parents[0].id;

                await promisePool.query(
                    'UPDATE categories SET parent_id = ? WHERE slug = ?',
                    [parentId, childSlug]
                );
                updatedParentsCount++;
            } else {
                console.warn(`Parent not found for category "${cat.cat_name}" (slug: ${childSlug}): "${parentName}"`);
            }
        }

        console.log(`Updated ${updatedParentsCount} parent relationships.`);
        console.log('Categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
