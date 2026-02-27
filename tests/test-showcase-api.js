const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/mobile-app';

// Test user token (update with a valid token)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3VuZGJ1eS5jb20iLCJpYXQiOjE3MzgwNjE5MzcsImV4cCI6MTczODY2NjczN30.Ov8Yz4YhNrGqxLZqDdJYXJKFqKLqOXJKQZqLqOXJKQZ'; // Replace with actual token

async function testBrowseWithShowcases() {
    try {
        console.log('🧪 Testing Browse Advertisements with ShowCases...\n');

        const response = await axios.get(`${BASE_URL}/advertisements/browse?page=1&limit=20`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        const { advertisements } = response.data.data;

        console.log(`📊 Total items returned: ${advertisements.length}\n`);

        // Count showcases and regular ads
        let showcaseCount = 0;
        let adCount = 0;
        const showcasePositions = [];

        advertisements.forEach((item, index) => {
            if (item.type === 'showcase') {
                showcaseCount++;
                showcasePositions.push(index + 1);
                console.log(`\n🎪 SHOWCASE at position ${index + 1}:`);
                console.log(`   Group ID: ${item.showcase_group_id}`);
                console.log(`   Seller: ${item.seller_name}`);
                console.log(`   Products: ${item.product_count}`);
                console.log(`   Product IDs: ${item.products.map(p => p.id).join(', ')}`);
            } else {
                adCount++;
            }
        });

        console.log(`\n\n📈 Summary:`);
        console.log(`   Regular Ads: ${adCount}`);
        console.log(`   Showcases: ${showcaseCount}`);
        console.log(`   Showcase Positions: ${showcasePositions.join(', ')}`);

        // Verify showcases appear after every 4 ads
        const expectedPositions = [5, 9, 13, 17]; // After 4, 8, 12, 16 ads
        const correctPositions = showcasePositions.every((pos, i) => pos === expectedPositions[i]);

        if (correctPositions && showcaseCount > 0) {
            console.log(`\n✅ Showcases injected correctly after every 4 ads!`);
        } else if (showcaseCount === 0) {
            console.log(`\n⚠️  No showcases found (this is okay if none are active)`);
        } else {
            console.log(`\n⚠️  Showcase positions don't match expected pattern`);
            console.log(`   Expected: ${expectedPositions.join(', ')}`);
            console.log(`   Actual: ${showcasePositions.join(', ')}`);
        }

        // Show sample showcase structure
        const sampleShowcase = advertisements.find(item => item.type === 'showcase');
        if (sampleShowcase) {
            console.log(`\n📦 Sample Showcase Structure:`);
            console.log(JSON.stringify({
                type: sampleShowcase.type,
                showcase_group_id: sampleShowcase.showcase_group_id,
                seller_name: sampleShowcase.seller_name,
                product_count: sampleShowcase.product_count,
                products: sampleShowcase.products.slice(0, 2).map(p => ({
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    images: p.images.slice(0, 1)
                }))
            }, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testBrowseWithShowcases();
