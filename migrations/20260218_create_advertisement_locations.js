const { promisePool } = require('../src/config/database');

async function migrate() {
    try {
        console.log('Starting migration: Create advertisement_locations table and migrate data...');

        // 1. Create table
        await promisePool.query(`
      CREATE TABLE IF NOT EXISTS advertisement_locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        advertisement_id INT NOT NULL,
        location_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES user_locations(id) ON DELETE CASCADE,
        
        INDEX idx_ad_loc (advertisement_id, location_id),
        INDEX idx_loc_ad (location_id, advertisement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✓ Created advertisement_locations table');

        // 2. Migrate existing data
        // Select ads that have a location_id and are NOT yet in the new table
        const [adsToMigrate] = await promisePool.query(`
      SELECT id, location_id 
      FROM advertisements 
      WHERE location_id IS NOT NULL
      AND id NOT IN (SELECT DISTINCT advertisement_id FROM advertisement_locations)
    `);

        if (adsToMigrate.length > 0) {
            console.log(`Found ${adsToMigrate.length} advertisements to migrate.`);

            const values = adsToMigrate.map(ad => [ad.id, ad.location_id]);

            // Bulk insert
            await promisePool.query(
                'INSERT INTO advertisement_locations (advertisement_id, location_id) VALUES ?',
                [values]
            );
            console.log(`✓ Migrated ${adsToMigrate.length} location records.`);
        } else {
            console.log('ℹ No advertisements needed migration.');
        }

        // 3. Optional: Drop location_id column from advertisements table?
        // For now, we will KEEP it for backward compatibility but allow it to be NULL.
        // Ensure it is nullable (it usually is by default if not specified NOT NULL, but let's be safe if we were strictly enforcing it).
        // ALTER TABLE advertisements MODIFY COLUMN location_id INT NULL;

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
