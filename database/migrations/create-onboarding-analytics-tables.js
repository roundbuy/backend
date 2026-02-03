const mysql = require('mysql2/promise');
const path = require('path');
// Load env vars from root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createOnboardingAnalyticsTables() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        // Use env vars directly
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'roundbuy_db'
        });

        console.log('✅ Connected to database.');

        // Create onboarding_events table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS onboarding_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tour_id VARCHAR(50) NOT NULL COMMENT 'e.g., registration_tour, welcome_tour',
        step_index INT NOT NULL COMMENT 'The step number the user is on',
        action VARCHAR(20) NOT NULL COMMENT 'view, next, skip, finish, error',
        session_id VARCHAR(100) NOT NULL COMMENT 'Device or session identifier',
        device_type VARCHAR(20) COMMENT 'ios, android, web',
        user_id INT COMMENT 'Nullable, if user is logged in',
        metadata JSON COMMENT 'Additional data like error details or completion time',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tour_action_date (tour_id, action, created_at),
        INDEX idx_session (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        console.log('🛠 Creating onboarding_events table...');
        await connection.query(createTableQuery);
        console.log('✅ onboarding_events table created or already exists.');

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

createOnboardingAnalyticsTables();
