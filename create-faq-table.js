const { promisePool: db } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function createFaqTables() {
    try {
        console.log('🔨 Creating FAQ Management System...\n');

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'database', 'create-faq-table.sql');
        let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Remove comment lines (lines starting with --)
        sqlContent = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        // Split by semicolons to handle multiple statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            if (statement.toUpperCase().includes('CREATE TABLE IF NOT EXISTS faq_categories')) {
                console.log('📋 Creating faq_categories table...');
                await db.query(statement);
                console.log('✅ faq_categories table created successfully!\n');
            } else if (statement.toUpperCase().includes('CREATE TABLE IF NOT EXISTS faq_subcategories')) {
                console.log('📋 Creating faq_subcategories table...');
                await db.query(statement);
                console.log('✅ faq_subcategories table created successfully!\n');
            } else if (statement.toUpperCase().includes('CREATE TABLE IF NOT EXISTS faqs')) {
                console.log('📋 Creating faqs table...');
                await db.query(statement);
                console.log('✅ faqs table created successfully!\n');
            } else if (statement.toUpperCase().includes('INSERT INTO faq_categories')) {
                console.log('📥 Inserting FAQ categories...');
                await db.query(statement);
                console.log('✅ Categories inserted successfully!\n');
            } else if (statement.toUpperCase().includes('INSERT INTO faq_subcategories')) {
                console.log('📥 Inserting FAQ subcategories...');
                await db.query(statement);
                console.log('✅ Subcategories inserted successfully!\n');
            } else if (statement.toUpperCase().includes('INSERT INTO faqs')) {
                console.log('📥 Inserting sample FAQ data...');
                await db.query(statement);
                console.log('✅ Sample FAQs inserted successfully!\n');
            } else {
                await db.query(statement);
            }
        }

        console.log('\n' + '═'.repeat(80));
        console.log('                        VERIFICATION REPORT');
        console.log('═'.repeat(80) + '\n');

        // Verify tables were created
        const [categoriesTable] = await db.query("SHOW TABLES LIKE 'faq_categories'");
        const [subcategoriesTable] = await db.query("SHOW TABLES LIKE 'faq_subcategories'");
        const [faqsTable] = await db.query("SHOW TABLES LIKE 'faqs'");

        if (categoriesTable.length > 0 && subcategoriesTable.length > 0 && faqsTable.length > 0) {
            console.log('✅ All FAQ tables exist in database\n');

            // Get statistics
            const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM faq_categories');
            const [subcategoryCount] = await db.query('SELECT COUNT(*) as count FROM faq_subcategories');
            const [faqCount] = await db.query('SELECT COUNT(*) as count FROM faqs');

            console.log('📊 DATABASE STATISTICS:');
            console.log('─'.repeat(80));
            console.log(`   Categories:     ${categoryCount[0].count}`);
            console.log(`   Subcategories:  ${subcategoryCount[0].count}`);
            console.log(`   FAQs:           ${faqCount[0].count}`);
            console.log('─'.repeat(80) + '\n');

            // Show categories with subcategory counts
            const [categories] = await db.query(`
                SELECT 
                    c.id,
                    c.name,
                    c.sort_order,
                    COUNT(s.id) as subcategory_count
                FROM faq_categories c
                LEFT JOIN faq_subcategories s ON c.id = s.category_id
                GROUP BY c.id, c.name, c.sort_order
                ORDER BY c.sort_order
            `);

            console.log('📁 CATEGORIES OVERVIEW:');
            console.log('─'.repeat(80));
            categories.forEach(cat => {
                console.log(`   ${cat.sort_order}. ${cat.name}`);
                console.log(`      └─ ${cat.subcategory_count} subcategories\n`);
            });
            console.log('─'.repeat(80) + '\n');

            // Show sample FAQs with category and subcategory info
            const [sampleFaqs] = await db.query(`
                SELECT 
                    c.name as category,
                    s.name as subcategory,
                    f.question,
                    f.is_active
                FROM faqs f
                JOIN faq_categories c ON f.category_id = c.id
                JOIN faq_subcategories s ON f.subcategory_id = s.id
                ORDER BY c.sort_order, s.sort_order, f.sort_order
                LIMIT 10
            `);

            console.log('📝 SAMPLE FAQs:');
            console.log('─'.repeat(80));
            sampleFaqs.forEach((faq, index) => {
                const status = faq.is_active ? '✓' : '✗';
                console.log(`${index + 1}. [${faq.category} > ${faq.subcategory}]`);
                console.log(`   Q: ${faq.question.substring(0, 70)}${faq.question.length > 70 ? '...' : ''}`);
                console.log(`   Status: ${status} ${faq.is_active ? 'Active' : 'Inactive'}\n`);
            });
            console.log('─'.repeat(80) + '\n');

        } else {
            console.log('❌ Warning: Some tables were not created successfully');
        }

        console.log('═'.repeat(80));
        console.log('🎉 FAQ Management System setup completed successfully!');
        console.log('═'.repeat(80) + '\n');

        console.log('💡 NEXT STEPS:');
        console.log('   1. Create backend API endpoints for FAQ management');
        console.log('   2. Create admin panel UI for managing FAQs');
        console.log('   3. Create frontend display component for FAQs');
        console.log('   4. Add search functionality for FAQs\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error creating FAQ tables:', error.message);
        console.error('\n📋 Error details:', error);
        process.exit(1);
    }
}

// Run the script
createFaqTables();
