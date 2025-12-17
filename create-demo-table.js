const { promisePool: db } = require('./src/config/database');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS advertisements_demo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    subcategory_id INT,
    activity_id INT,
    condition_id INT,
    location_id INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    location_name VARCHAR(255),
    images JSON,
    status ENUM('active', 'sold', 'inactive') DEFAULT 'active',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_demo_category (category_id),
    INDEX idx_demo_location (latitude, longitude),
    INDEX idx_demo_status (status),
    INDEX idx_demo_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function createTable() {
    try {
        console.log('🔨 Creating advertisements_demo table...');
        await db.query(createTableSQL);
        console.log('✅ Table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        process.exit(1);
    }
}

createTable();
