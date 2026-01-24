/**
 * Extract All Translation Keys from Mobile App
 * Scans all screens and extracts t() function calls
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const SCREEN_DIRS = [
    'src/screens',
    'src/components',
    'src/navigation'
];

const BASE_PATH = path.join(__dirname, '..', 'mobile-app');

// Store all found keys
const translationKeys = new Set();
const keysByFile = {};

/**
 * Extract translation keys from a file
 */
function extractKeysFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.relative(BASE_PATH, filePath);

        // Match t('key', 'default') or t("key", "default") or t('key')
        const regex = /t\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)/g;

        let match;
        const fileKeys = [];

        while ((match = regex.exec(content)) !== null) {
            const key = match[1];
            const defaultValue = match[2] || '';

            translationKeys.add(key);
            fileKeys.push({ key, defaultValue });
        }

        if (fileKeys.length > 0) {
            keysByFile[fileName] = fileKeys;
        }

    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
    }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            extractKeysFromFile(filePath);
        }
    });
}

/**
 * Main execution
 */
console.log('🔍 Scanning mobile app for translation keys...\n');

SCREEN_DIRS.forEach(dir => {
    const fullPath = path.join(BASE_PATH, dir);
    if (fs.existsSync(fullPath)) {
        console.log(`📂 Scanning ${dir}...`);
        scanDirectory(fullPath);
    }
});

// Sort keys
const sortedKeys = Array.from(translationKeys).sort();

// Group keys by namespace
const keysByNamespace = {};
sortedKeys.forEach(key => {
    const namespace = key.split('.')[0];
    if (!keysByNamespace[namespace]) {
        keysByNamespace[namespace] = [];
    }
    keysByNamespace[namespace].push(key);
});

// Print results
console.log('\n📊 Translation Keys Summary:');
console.log('─'.repeat(60));
console.log(`Total unique keys found: ${sortedKeys.length}`);
console.log(`Files with translations: ${Object.keys(keysByFile).length}`);
console.log('\n📋 Keys by Namespace:');
Object.keys(keysByNamespace).sort().forEach(namespace => {
    console.log(`  ${namespace}: ${keysByNamespace[namespace].length} keys`);
});

// Save to JSON file
const outputPath = path.join(__dirname, 'extracted-translation-keys.json');
const output = {
    totalKeys: sortedKeys.length,
    extractedAt: new Date().toISOString(),
    keys: sortedKeys,
    keysByNamespace,
    keysByFile
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\n💾 Keys saved to: ${path.relative(process.cwd(), outputPath)}`);

// Print all keys
console.log('\n📝 All Translation Keys:');
console.log('─'.repeat(60));
sortedKeys.forEach((key, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${key}`);
});

console.log('\n✨ Done!');
