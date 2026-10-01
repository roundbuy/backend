const mysql = require('mysql2/promise');
const path = require('path');
// Load env vars from root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createMarketplaceKpiTables() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy_db'
        });

        console.log('✅ Connected to database.');

        // 1. Create surveys_nps table
        const createNpsTable = `
            CREATE TABLE IF NOT EXISTS surveys_nps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                role VARCHAR(20) NOT NULL COMMENT 'buyer, seller',
                score INT NOT NULL COMMENT '0-10 rating',
                comment TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_role_score (role, score),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        console.log('🛠 Creating surveys_nps table...');
        await connection.query(createNpsTable);
        console.log('✅ surveys_nps table created.');

        // 2. Create surveys_beta_feedback table
        const createBetaTable = `
            CREATE TABLE IF NOT EXISTS surveys_beta_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                round INT NOT NULL COMMENT 'Stage/Round 1-4',
                platform VARCHAR(20) NOT NULL COMMENT 'web, android, ios',
                rating INT NOT NULL COMMENT '1-5 stars',
                is_positive TINYINT(1) DEFAULT 1 COMMENT 'Sentiment tracking flag',
                feedback_text TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_round_platform (round, platform),
                INDEX idx_sentiment (is_positive),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        console.log('🛠 Creating surveys_beta_feedback table...');
        await connection.query(createBetaTable);
        console.log('✅ surveys_beta_feedback table created.');

        // 3. Create traffic_analytics table
        const createTrafficTable = `
            CREATE TABLE IF NOT EXISTS traffic_analytics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source_name VARCHAR(50) NOT NULL COMMENT 'organic, paid, referral, chatgpt, gemini, perplexity, google_ai_overview',
                visitor_count INT DEFAULT 1,
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_source_date (source_name, date),
                INDEX idx_date (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        console.log('🛠 Creating traffic_analytics table...');
        await connection.query(createTrafficTable);
        console.log('✅ traffic_analytics table created.');

    } catch (error) {
        console.error('❌ Error running migration:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('👋 Database connection closed.');
        }
    }
}

createMarketplaceKpiTables();
