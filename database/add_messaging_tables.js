const { promisePool } = require('../src/config/database');
require('dotenv').config();

async function addMessagingTables() {
  try {
    console.log('Adding messaging system tables...\n');

    const statements = [
      // Add advertisement_id column to messages table
      `ALTER TABLE messages ADD COLUMN advertisement_id INT DEFAULT NULL AFTER product_id`,
      `ALTER TABLE messages ADD FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE`,

      // Create conversations table
      `CREATE TABLE conversations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        advertisement_id INT NOT NULL,
        buyer_id INT NOT NULL,
        seller_id INT NOT NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_conversation (advertisement_id, buyer_id, seller_id),
        INDEX idx_advertisement_id (advertisement_id),
        INDEX idx_buyer_id (buyer_id),
        INDEX idx_seller_id (seller_id),
        INDEX idx_last_message_at (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Create offers table
      `CREATE TABLE offers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        offered_price DECIMAL(10, 2) NOT NULL,
        currency_code VARCHAR(3) DEFAULT 'INR',
        message TEXT,
        status ENUM('pending', 'accepted', 'rejected', 'counter_offered', 'expired') DEFAULT 'pending',
        expires_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_status (status),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Update messages table to include conversation_id
      `ALTER TABLE messages ADD COLUMN conversation_id INT DEFAULT NULL AFTER advertisement_id`,
      `ALTER TABLE messages ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE`,

      // Add indexes for better performance
      `ALTER TABLE messages ADD INDEX idx_conversation_id (conversation_id)`,
      `ALTER TABLE messages ADD INDEX idx_sender_receiver (sender_id, receiver_id)`,
      `ALTER TABLE messages ADD INDEX idx_is_read (is_read)`
    ];

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await promisePool.query(statement);

        // Log progress
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE\s+(\w+)/i);
          if (match) {
            console.log(`✓ Created table: ${match[1]}`);
          }
        } else if (statement.includes('ALTER TABLE')) {
          console.log(`✓ Altered table with: ${statement.split(' ').slice(0, 4).join(' ')}...`);
        }
      } catch (error) {
        // Only log error if it's not about column/table already existing
        if (!error.message.includes('already exists') && !error.message.includes("Duplicate column name")) {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          throw error;
        } else {
          console.log(`⚠ Statement ${i + 1} skipped (already exists)`);
        }
      }
    }

    console.log('\n✓ Messaging tables added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to add messaging tables:', error.message);
    process.exit(1);
  }
}

// Run the migration
addMessagingTables();