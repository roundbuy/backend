const { promisePool } = require('../src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixIcons() {
    console.log('🔧 Fixing Icons...');

    try {
        // Change 'post' to 'bullhorn' for Ads
        await promisePool.query('UPDATE reward_categories SET icon = "bullhorn" WHERE name LIKE "%Make 5 x Ads%"');

        // Change 'check-decagram' to 'check-decagram' (verified valid) or 'certificate' just in case. 
        // usage: MCommunityIcons. valid names: https://icons.expo.fyi/Index/MaterialCommunityIcons/check-decagram (Valid)
        // 'post' is NOT valid in MCI? https://icons.expo.fyi/Index/MaterialCommunityIcons/post => "post" exists! 
        // Wait, "post" exists in MaterialCommunityIcons.

        // Let's verify 'eye'. Yes.
        // Let's verify 'trophy'. Yes.

        // Maybe the user just needs to SCROLL? The screenshot shows a list that cuts off.
        // But the user said "need in same order".

        // Let's update 'post' to 'bullhorn' anyway as its more appropriate for Ads.
        // Let's update 'check-decagram' to 'certificate' to match "Diligent Seller mark".

        await promisePool.query('UPDATE reward_categories SET icon = "certificate" WHERE name LIKE "%Diligent Seller%"');

        console.log('✅ Icons updated!');

    } catch (error) {
        console.error('❌ Update failed:', error);
    } finally {
        process.exit();
    }
}

fixIcons();
