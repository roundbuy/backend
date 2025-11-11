const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('Starting database migration...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement) {
        try {
          await promisePool.query(statement);
          
          // Log progress for table creation
          if (statement.includes('CREATE TABLE')) {
            const match = statement.match(/CREATE TABLE\s+(\w+)/i);
            if (match) {
              console.log(`✓ Created table: ${match[1]}`);
            }
          } else if (statement.includes('INSERT INTO')) {
            const match = statement.match(/INSERT INTO\s+(\w+)/i);
            if (match) {
              console.log(`✓ Inserted data into: ${match[1]}`);
            }
          }
        } catch (error) {
          // Only log error if it's not about table already existing
          if (!error.message.includes('already exists')) {
            console.error(`✗ Error executing statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n✓ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();