const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function ensureTrackingTable() {
  await promisePool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function getApplied() {
  const [rows] = await promisePool.query('SELECT filename FROM _migrations');
  return new Set(rows.map(r => r.filename));
}

async function runFile(filepath, filename) {
  const sql = fs.readFileSync(filepath, 'utf8');

  // Split on semicolons, but keep TRANSACTION blocks intact by running the whole file
  // Use multipleStatements via a fresh connection for this file
  const conn = await promisePool.getConnection();
  try {
    // Execute statement by statement (handles TRANSACTION, ALTER, CREATE, INSERT)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    const DDL = /^(CREATE|ALTER|DROP|RENAME|TRUNCATE)/i;
    let warnings = 0;

    for (const stmt of statements) {
      const clean = stmt.endsWith(';') ? stmt : stmt + ';';
      if (/^(--|\/\*|COMMIT|START TRANSACTION|ROLLBACK)/.test(clean.trim())) continue;
      try {
        await conn.query(clean);
      } catch (err) {
        if (DDL.test(clean.trim()) && !err.message.includes('already exists') && !err.message.includes('Duplicate')) {
          // DDL errors that aren't "already exists" are fatal
          throw err;
        }
        // Data errors and "already exists" are warnings — log and continue
        console.warn(`    ⚠ Skipped: ${err.message.slice(0, 90)}`);
        warnings++;
      }
    }

    await promisePool.query('INSERT INTO _migrations (filename) VALUES (?)', [filename]);
    const suffix = warnings ? ` (${warnings} warning${warnings > 1 ? 's' : ''})` : '';
    console.log(`  ✓ ${filename}${suffix}`);
  } finally {
    conn.release();
  }
}

async function run() {
  try {
    console.log('🔄 Running pending migrations...\n');

    await ensureTrackingTable();
    const applied = await getApplied();

    // Only process .sql files, sorted alphabetically (date-prefixed files run in order)
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅ Nothing to migrate — all migrations already applied.');
      process.exit(0);
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);
    for (const file of pending) {
      await runFile(path.join(MIGRATIONS_DIR, file), file);
    }

    console.log('\n✅ All migrations applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

run();
