const { initDatabase, query } = require('./config/database');

async function updateRoles() {
    console.log('🔄 Updating roles in users table...');
    
    try {
        await initDatabase();
        console.log('✅ Database connected');

        // إعادة إنشاء جدول users مع الأدوار الجديدة
        await query(`
            CREATE TABLE IF NOT EXISTS users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                role TEXT NOT NULL CHECK (role IN ('owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center', 'bank_manager', 'leasing_manager', 'admin')),
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Temporary table created');

        // نسخ البيانات
        await query(`
            INSERT INTO users_new (id, email, password, name, phone, role, is_active, created_at, updated_at)
            SELECT id, email, password, name, phone, role, is_active, created_at, updated_at FROM users
        `);
        console.log('✅ Data copied');

        // حذف الجدول القديم
        await query(`DROP TABLE users`);
        console.log('✅ Old table dropped');

        // إعادة تسمية الجدول الجديد
        await query(`ALTER TABLE users_new RENAME TO users`);
        console.log('✅ New table renamed');

        // إضافة المستخدمين الجدد
        const bcrypt = require('bcryptjs');
        
        const bankPassword = bcrypt.hashSync('bank123', 10);
        await query(`
            INSERT OR IGNORE INTO users (name, email, password, role, phone, is_active)
            VALUES ('مدير بنك', 'bank@shamsi.tn', $1, 'bank_manager', '24661499', 1)
        `, [bankPassword]);
        console.log('✅ Bank manager added');

        const leasingPassword = bcrypt.hashSync('leasing123', 10);
        await query(`
            INSERT OR IGNORE INTO users (name, email, password, role, phone, is_active)
            VALUES ('مدير تأجير', 'leasing@shamsi.tn', $1, 'leasing_manager', '24661499', 1)
        `, [leasingPassword]);
        console.log('✅ Leasing manager added');

        // التحقق
        const result = await query(`SELECT id, name, email, role FROM users`);
        console.log('\n📋 All users:');
        (result.rows || result).forEach(u => {
            console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
        });

        console.log('\n✅ Roles updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating roles:', error);
    } finally {
        process.exit(0);
    }
}

updateRoles();