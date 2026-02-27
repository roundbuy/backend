const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

async function checkHomeMarket() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const homemarketQuery = `
          SELECT 
            a.user_id,
            u.full_name as seller_name,
            pb.badge_level as tier,
            pb.priority_level,
            pb.expiry_date as expires_at,
            a.id as advertisement_id,
            a.title,
            a.price
          FROM product_badges pb
          JOIN advertisements a ON pb.advertisement_id = a.id
          JOIN users u ON a.user_id = u.id
          WHERE pb.badge_type = 'visibility'
            AND pb.badge_level IN ('homemarket-gold-7-days', 'homemarket-orange-7-days', 'homemarket-green-7-days')
            AND pb.is_active = TRUE
            AND (pb.expiry_date IS NULL OR pb.expiry_date > NOW())
            AND a.status = 'published'
          ORDER BY pb.priority_level DESC, a.created_at DESC
        `;
        
        const [homemarkets] = await connection.query(homemarketQuery);
        console.log("RAW RESULTS:");
        console.table(homemarkets);

        const userGroups = {};
        homemarkets.forEach(hm => {
          if (!userGroups[hm.user_id]) {
            userGroups[hm.user_id] = {
              type: 'homemarket',
              tier: hm.tier.includes('gold') ? 'gold' : hm.tier.includes('orange') ? 'orange' : 'green',
              seller_name: hm.seller_name,
              seller_id: hm.user_id,
              priority_level: hm.priority_level,
              products: []
            };
          }
          userGroups[hm.user_id].products.push({
            id: hm.advertisement_id,
            title: hm.title,
            price: hm.price
          });
        });

        const result = Object.values(userGroups).sort((a, b) => b.priority_level - a.priority_level);
        console.log("\nGROUPED RESULTS (What mobile app receives):");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}
checkHomeMarket();
