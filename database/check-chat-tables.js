const { promisePool } = require('../src/config/database');
require('dotenv').config();

async function checkChatTables() {
    try {
        console.log('Checking chat-related tables...\n');

        // Check for conversations table
        const [conversations] = await promisePool.query("SHOW TABLES LIKE 'conversations'");
        console.log('✓ conversations table:', conversations.length > 0 ? 'EXISTS' : 'NOT FOUND');

        // Check for offers table
        const [offers] = await promisePool.query("SHOW TABLES LIKE 'offers'");
        console.log('✓ offers table:', offers.length > 0 ? 'EXISTS' : 'NOT FOUND');

        // Check for messages table
        const [messages] = await promisePool.query("SHOW TABLES LIKE 'messages'");
        console.log('✓ messages table:', messages.length > 0 ? 'EXISTS' : 'NOT FOUND');

        if (conversations.length > 0) {
            console.log('\n--- Conversations Table Structure ---');
            const [convCols] = await promisePool.query("DESCRIBE conversations");
            convCols.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key}`);
            });

            const [convCount] = await promisePool.query("SELECT COUNT(*) as count FROM conversations");
            console.log(`  Total conversations: ${convCount[0].count}`);
        }

        if (offers.length > 0) {
            console.log('\n--- Offers Table Structure ---');
            const [offerCols] = await promisePool.query("DESCRIBE offers");
            offerCols.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key}`);
            });

            const [offerCount] = await promisePool.query("SELECT COUNT(*) as count FROM offers");
            console.log(`  Total offers: ${offerCount[0].count}`);
        }

        if (messages.length > 0) {
            console.log('\n--- Messages Table Structure ---');
            const [msgCols] = await promisePool.query("DESCRIBE messages");
            msgCols.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key}`);
            });

            const [msgCount] = await promisePool.query("SELECT COUNT(*) as count FROM messages");
            console.log(`  Total messages: ${msgCount[0].count}`);
        }

        console.log('\n✓ Chat tables check complete!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error checking tables:', error.message);
        process.exit(1);
    }
}

checkChatTables();
