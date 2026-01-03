require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function runMigrationManually() {
    try {
        console.log('🚀 Starting Phase 1 migration...\n');

        // 1. Create issues table
        console.log('Creating issues table...');
        try {
            await promisePool.query(`
        CREATE TABLE IF NOT EXISTS issues (
          id INT PRIMARY KEY AUTO_INCREMENT,
          issue_number VARCHAR(20) UNIQUE NOT NULL,
          created_by INT NOT NULL,
          other_party_id INT NOT NULL,
          advertisement_id INT NOT NULL,
          issue_type ENUM('exchange', 'quality', 'delivery', 'price', 'description_mismatch', 'other') NOT NULL,
          issue_description TEXT NOT NULL,
          status ENUM('pending', 'accepted', 'rejected', 'escalated', 'expired') DEFAULT 'pending',
          issue_deadline TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          accepted_at TIMESTAMP NULL,
          rejected_at TIMESTAMP NULL,
          escalated_at TIMESTAMP NULL,
          escalated_dispute_id INT NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (other_party_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
          INDEX idx_created_by (created_by, status),
          INDEX idx_other_party (other_party_id, status),
          INDEX idx_issue_number (issue_number),
          INDEX idx_status (status),
          INDEX idx_deadline (issue_deadline)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            console.log('✅ Created issues table\n');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('⚠️  issues table already exists\n');
            } else {
                throw error;
            }
        }

        // 2. Create issue_messages table
        console.log('Creating issue_messages table...');
        try {
            await promisePool.query(`
        CREATE TABLE IF NOT EXISTS issue_messages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          issue_id INT NOT NULL,
          user_id INT NOT NULL,
          message TEXT NOT NULL,
          is_system_message BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_issue_messages (issue_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            console.log('✅ Created issue_messages table\n');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('⚠️  issue_messages table already exists\n');
            } else {
                throw error;
            }
        }

        // 3. Create dispute_claims table
        console.log('Creating dispute_claims table...');
        try {
            await promisePool.query(`
        CREATE TABLE IF NOT EXISTS dispute_claims (
          id INT PRIMARY KEY AUTO_INCREMENT,
          dispute_id INT NOT NULL,
          created_by INT NOT NULL,
          claim_description TEXT NOT NULL,
          claim_deadline TIMESTAMP NOT NULL,
          buyer_id INT NOT NULL,
          seller_id INT NOT NULL,
          buyer_answered BOOLEAN DEFAULT FALSE,
          seller_answered BOOLEAN DEFAULT FALSE,
          buyer_answer TEXT NULL,
          seller_answer TEXT NULL,
          buyer_answer_submitted_at TIMESTAMP NULL,
          seller_answer_submitted_at TIMESTAMP NULL,
          buyer_evidence JSON NULL,
          seller_evidence JSON NULL,
          winner_id INT NULL,
          status ENUM('pending', 'answered', 'resolved', 'expired') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP NULL,
          FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_dispute_claim (dispute_id),
          INDEX idx_claim_deadline (claim_deadline),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
            console.log('✅ Created dispute_claims table\n');
        } catch (error) {
            if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                console.log('⚠️  dispute_claims table already exists\n');
            } else {
                throw error;
            }
        }

        // 4. Add columns to disputes table
        console.log('Adding columns to disputes table...');
        const columnsToAdd = [
            { name: 'issue_id', sql: 'ADD COLUMN issue_id INT NULL AFTER advertisement_id' },
            { name: 'dispute_deadline', sql: 'ADD COLUMN dispute_deadline TIMESTAMP NULL AFTER negotiation_deadline' },
            { name: 'claim_deadline', sql: 'ADD COLUMN claim_deadline TIMESTAMP NULL AFTER dispute_deadline' },
            { name: 'resolution_deadline', sql: 'ADD COLUMN resolution_deadline TIMESTAMP NULL AFTER claim_deadline' },
            { name: 'current_phase', sql: "ADD COLUMN current_phase ENUM('issue', 'dispute', 'claim', 'resolution', 'ended') DEFAULT 'dispute' AFTER resolution_status" }
        ];

        for (const column of columnsToAdd) {
            try {
                await promisePool.query(`ALTER TABLE disputes ${column.sql}`);
                console.log(`✅ Added column: ${column.name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠️  Column ${column.name} already exists`);
                } else {
                    console.error(`❌ Error adding ${column.name}:`, error.sqlMessage);
                }
            }
        }

        // 5. Add foreign key
        console.log('\nAdding foreign key constraint...');
        try {
            await promisePool.query(`
        ALTER TABLE disputes
        ADD CONSTRAINT fk_disputes_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
      `);
            console.log('✅ Added foreign key constraint\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
                console.log('⚠️  Foreign key already exists\n');
            } else {
                console.log(`⚠️  Skipping foreign key: ${error.sqlMessage}\n`);
            }
        }

        // 6. Add indexes
        console.log('Adding indexes...');
        const indexes = [
            'idx_current_phase',
            'idx_dispute_deadline',
            'idx_claim_deadline',
            'idx_resolution_deadline'
        ];

        for (const index of indexes) {
            try {
                const column = index.replace('idx_', '');
                await promisePool.query(`ALTER TABLE disputes ADD INDEX ${index} (${column})`);
                console.log(`✅ Added index: ${index}`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️  Index ${index} already exists`);
                } else {
                    console.log(`⚠️  Skipping index ${index}: ${error.sqlMessage}`);
                }
            }
        }

        // Verify
        console.log('\n📋 Verifying migration...');
        const [tables] = await promisePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('issues', 'dispute_claims', 'issue_messages')
    `);

        console.log(`\n✅ Tables created: ${tables.length}/3`);
        tables.forEach(t => console.log(`   - ${t.table_name}`));

        console.log('\n✨ Phase 1 migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigrationManually();
