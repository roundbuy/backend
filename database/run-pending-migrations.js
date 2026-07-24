/**
 * Run all pending SQL migrations from backend/migrations/
 *
 * Tracks which files have been applied in a `_migrations` table.
 * Safe to re-run — already-applied files are skipped.
 *
 * Usage (from backend/):
 *   node database/run-pending-migrations.js
 *
 * To force re-run a specific file:
 *   node database/run-pending-migrations.js --force 2026-06-24-user-interests-and-extensions.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const FORCE_FILE = process.argv.includes('--force')
    ? process.argv[process.argv.indexOf('--force') + 1]
    : null;

async function ensureMigrationsTable() {
    await promisePool.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            filename   VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

async function getAppliedMigrations() {
    const [rows] = await promisePool.query('SELECT filename FROM _migrations');
    return new Set(rows.map(r => r.filename));
}

async function markApplied(filename) {
    await promisePool.query(
        'INSERT IGNORE INTO _migrations (filename) VALUES (?)',
        [filename]
    );
}

async function runSqlFile(filePath, filename) {
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split on semicolons, skip blank lines and comments
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`\n▶  ${filename}  (${statements.length} statement${statements.length !== 1 ? 's' : ''})`);

    let ok = 0, skipped = 0, errors = 0;

    for (const stmt of statements) {
        try {
            await promisePool.query(stmt);
            ok++;

            if (/CREATE TABLE/i.test(stmt)) {
                const m = stmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)[`"]?/i);
                console.log(`   ✅ Created table: ${m?.[1] || '(unknown)'}`);
            } else if (/ALTER TABLE/i.test(stmt) && /ADD COLUMN/i.test(stmt)) {
                const m = stmt.match(/ALTER TABLE\s+[`"]?(\w+)[`"]?/i);
                const col = stmt.match(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)[`"]?/i);
                console.log(`   ✅ Added column ${col?.[1] || ''} to ${m?.[1] || ''}`);
            } else if (/INSERT INTO/i.test(stmt)) {
                const m = stmt.match(/INSERT INTO\s+[`"]?(\w+)[`"]?/i);
                console.log(`   ✅ Inserted into: ${m?.[1] || ''}`);
            } else if (/UPDATE/i.test(stmt)) {
                console.log(`   ✅ Updated rows`);
            }
        } catch (err) {
            const ignorable = [
                'ER_TABLE_EXISTS_ERROR',
                'ER_DUP_FIELDNAME',
                'ER_DUP_KEYNAME',
                'ER_CANT_DROP_FIELD_OR_KEY',
                'ER_DUP_ENTRY',
            ];
            if (ignorable.includes(err.code)) {
                console.log(`   ⚠️  Already exists — skipped (${err.code})`);
                skipped++;
            } else {
                console.error(`   ❌ Error: ${err.sqlMessage || err.message}`);
                errors++;
            }
        }
    }

    console.log(`   → ${ok} ok  ${skipped} skipped  ${errors} errors`);
    return errors === 0;
}

async function main() {
    try {
        console.log('🚀 RoundBuy — Pending Migrations Runner');
        console.log('   DB:', process.env.DB_NAME, 'on', process.env.DB_HOST);
        console.log('─'.repeat(50));

        await ensureMigrationsTable();
        const applied = await getAppliedMigrations();

        // Only pick up .sql files (skip .js runner scripts inside migrations/)
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        const pending = FORCE_FILE
            ? files.filter(f => f === FORCE_FILE)
            : files.filter(f => !applied.has(f));

        if (pending.length === 0) {
            console.log('\n✨ All migrations already applied. Nothing to do.\n');
            process.exit(0);
        }

        console.log(`\n📋 ${pending.length} pending migration${pending.length !== 1 ? 's' : ''}:\n`);
        pending.forEach(f => console.log(`   • ${f}`));

        let totalErrors = 0;
        for (const filename of pending) {
            const filePath = path.join(MIGRATIONS_DIR, filename);
            const success = await runSqlFile(filePath, filename);
            if (success) {
                await markApplied(filename);
            } else {
                totalErrors++;
                console.log(`   ⛔ Skipping mark-as-applied due to errors in ${filename}`);
            }
        }

        console.log('\n' + '─'.repeat(50));
        if (totalErrors === 0) {
            console.log(`✅ All ${pending.length} migration${pending.length !== 1 ? 's' : ''} applied successfully!\n`);
        } else {
            console.log(`⚠️  Completed with errors in ${totalErrors} file${totalErrors !== 1 ? 's' : ''}. Check output above.\n`);
        }

        process.exit(totalErrors > 0 ? 1 : 0);
    } catch (err) {
        console.error('\n❌ Fatal error:', err.message || err);
        process.exit(1);
    }
}

main();
