/**
 * Create Admin User for Testing
 */

require('dotenv').config();
const { promisePool } = require('../src/config/database');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    try {
        console.log('🔧 Creating admin user...');

        const email = 'admin@roundbuy.com';
        const password = 'Admin@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin already exists
        const [existing] = await promisePool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            console.log('✅ Admin user already exists!');
            console.log('   Email:', email);
            console.log('   Password:', password);
            return;
        }

        // Create admin user
        const [result] = await promisePool.execute(
            `INSERT INTO users (
        email, 
        password, 
        full_name, 
        role, 
        is_active, 
        is_verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [email, hashedPassword, 'Admin User', 'admin', true, true]
        );

        console.log('✅ Admin user created successfully!');
        console.log('   ID:', result.insertId);
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Role: admin');
        console.log('');
        console.log('💡 You can now login with these credentials');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

createAdminUser();
