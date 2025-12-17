const fs = require('fs');
const csv = require('csv-parser');
const { promisePool: db } = require('./src/config/database');

const csvFilePath = './uploads/csv/gd_place_011024_311024_325ce0d3.csv';

// Mapping function to convert CSV columns to our database schema
function mapCSVToDatabase(row) {
    // Extract title and description
    const title = row.post_title || 'Demo Product';
    const description = row.post_content || '';

    // Parse price
    let price = parseFloat(row.price) || 0;
    if (price === 0) {
        // Infer price from title if not provided
        price = inferPrice(title);
    }

    // Parse location data
    const latitude = parseFloat(row.latitude) || 26.77777;
    const longitude = parseFloat(row.longitude) || 81.0817;
    const city = row.city || 'Demo City';
    const region = row.region || 'Demo State';
    const country = row.country || 'India';
    const location_name = `${city}, ${region}`;

    // Parse category - map 'mode' to activity_id
    let activity_id = 1; // Default: Sell
    const mode = (row.mode || '').toLowerCase();
    if (mode === 'buy') activity_id = 1;
    else if (mode === 'rent') activity_id = 2;
    else if (mode === 'service') activity_id = 3;
    else if (mode === 'give') activity_id = 4;
    else if (mode === 'sag') activity_id = 5;

    // Parse condition
    let condition_id = 2; // Default: Like New
    const condition = (row.condition || '').toLowerCase();
    if (condition.includes('new') || condition.includes('excellent')) condition_id = 1;
    else if (condition.includes('good')) condition_id = 2;
    else if (condition.includes('fair')) condition_id = 3;
    else if (condition.includes('poor')) condition_id = 4;

    // Parse images
    let images = [];
    if (row.post_images) {
        // Images are in format: url|id|| 
        const imageParts = row.post_images.split('|');
        if (imageParts[0]) {
            images.push(imageParts[0]);
        }
    }
    if (images.length === 0) {
        images.push(`https://via.placeholder.com/400x300?text=${encodeURIComponent(title)}`);
    }

    // Infer category from title/content
    const category_id = inferCategory(title, description);

    return {
        user_id: 1, // Demo user
        title: title.substring(0, 255), // Limit to 255 chars
        description: description,
        price: price,
        category_id: category_id,
        subcategory_id: null,
        activity_id: activity_id,
        condition_id: condition_id,
        location_id: null,
        latitude: latitude,
        longitude: longitude,
        city: city,
        state: region,
        country: country,
        location_name: location_name,
        images: JSON.stringify(images),
        status: 'active'
    };
}

// Infer category from title and description
function inferCategory(title, description) {
    const text = (title + ' ' + description).toLowerCase();

    if (text.match(/phone|mobile|laptop|computer|tv|television|camera|electronics|playstation|iphone|samsung|macbook/)) return 1; // Electronics
    if (text.match(/car|bike|vehicle|van|motorcycle|scooter|auto|honda|maruti|royal enfield/)) return 2; // Vehicles
    if (text.match(/sofa|furniture|table|chair|bed|bookshelf|dining|apartment|house|rent/)) return 3; // Furniture/Real Estate
    if (text.match(/sport|cricket|football|bike|bicycle|treadmill|gym|fitness|walking|dog/)) return 4; // Sports/Services
    if (text.match(/cloth|jacket|boots|shirt|maternity|baby|clothing/)) return 5; // Clothing
    if (text.match(/service|repair|fix|walking|reading|group/)) return 6; // Services
    if (text.match(/lawn|mower|garden|tool/)) return 7; // Tools/Garden

    return 1; // Default: Electronics
}

// Infer price based on product name
function inferPrice(title) {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('apartment') || lowerTitle.includes('house')) return 50000;
    if (lowerTitle.includes('car') || lowerTitle.includes('vehicle')) return 500000;
    if (lowerTitle.includes('van')) return 300000;
    if (lowerTitle.includes('bike') || lowerTitle.includes('motorcycle')) return 80000;
    if (lowerTitle.includes('laptop') || lowerTitle.includes('computer') || lowerTitle.includes('macbook')) return 45000;
    if (lowerTitle.includes('phone') || lowerTitle.includes('mobile') || lowerTitle.includes('iphone')) return 25000;
    if (lowerTitle.includes('furniture') || lowerTitle.includes('sofa') || lowerTitle.includes('table')) return 15000;
    if (lowerTitle.includes('tv') || lowerTitle.includes('television')) return 30000;
    if (lowerTitle.includes('camera')) return 35000;
    if (lowerTitle.includes('playstation') || lowerTitle.includes('gaming')) return 40000;
    if (lowerTitle.includes('watch')) return 5000;
    if (lowerTitle.includes('book')) return 300;
    if (lowerTitle.includes('clothes') || lowerTitle.includes('shirt') || lowerTitle.includes('jacket')) return 500;
    if (lowerTitle.includes('service')) return 0; // Services are often free or negotiable

    return 1000; // Default price
}

// Insert data into database
async function insertDemoAd(adData) {
    const query = `
        INSERT INTO advertisements_demo 
        (user_id, title, description, price, category_id, subcategory_id, activity_id, 
         condition_id, location_id, latitude, longitude, city, state, country, 
         location_name, images, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        adData.user_id,
        adData.title,
        adData.description,
        adData.price,
        adData.category_id,
        adData.subcategory_id,
        adData.activity_id,
        adData.condition_id,
        adData.location_id,
        adData.latitude,
        adData.longitude,
        adData.city,
        adData.state,
        adData.country,
        adData.location_name,
        adData.images,
        adData.status
    ];

    await db.query(query, values);
}

// Main import function
async function importCSV() {
    try {
        console.log('🚀 Starting CSV import...');
        console.log(`📁 Reading file: ${csvFilePath}`);

        // Clear existing demo data
        console.log('🗑️  Clearing existing demo data...');
        await db.query('DELETE FROM advertisements_demo');

        const results = [];

        // Read and parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Found ${results.length} rows in CSV`);

        // Process and insert each row
        let successCount = 0;
        let errorCount = 0;

        for (const row of results) {
            try {
                const adData = mapCSVToDatabase(row);
                await insertDemoAd(adData);
                successCount++;

                if (successCount % 10 === 0) {
                    console.log(`✅ Imported ${successCount}/${results.length} advertisements...`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error importing row:`, error.message);
            }
        }

        console.log('\n✨ Import Complete!');
        console.log(`✅ Successfully imported: ${successCount} advertisements`);
        if (errorCount > 0) {
            console.log(`❌ Failed to import: ${errorCount} advertisements`);
        }

        // Show sample of imported data
        const [sample] = await db.query('SELECT id, title, price, city, latitude, longitude FROM advertisements_demo LIMIT 5');
        console.log('\n📋 Sample of imported data:');
        console.table(sample);

        process.exit(0);
    } catch (error) {
        console.error('💥 Import failed:', error);
        process.exit(1);
    }
}

// Run the import
importCSV();
