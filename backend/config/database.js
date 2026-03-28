const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// استخدام PostgreSQL على Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://shamsi_user:p8pB9bEcXWzgdfg05DIi6sLRRsRClYRa@dpg-d741qaadbo4c738losm0-a/shamsi_tn',
    ssl: {
        rejectUnauthorized: false
    }
});

// اختبار الاتصال
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
    } else {
        console.log('✅ PostgreSQL database connected successfully');
        release();
        
        // إنشاء الجداول
        createTables();
    }
});

// إنشاء الجداول
async function createTables() {
    try {
        // جدول الأدمن
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // جدول المديرين
        await pool.query(`
            CREATE TABLE IF NOT EXISTS managers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                company_name VARCHAR(100),
                city VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // جدول العملاء
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                city VARCHAR(50) NOT NULL,
                property_type VARCHAR(50) DEFAULT 'house',
                payment_method VARCHAR(50) DEFAULT 'cash',
                monthly_bill DECIMAL NOT NULL,
                monthly_consumption DECIMAL,
                meter_owner INTEGER DEFAULT 1,
                meter_number VARCHAR(50),
                roof_area DECIMAL,
                roof_direction VARCHAR(50) DEFAULT 'جنوب',
                roof_type VARCHAR(50) DEFAULT 'مسطح',
                shading VARCHAR(50) DEFAULT 'لا يوجد',
                required_kw DECIMAL,
                estimated_price DECIMAL,
                panels INTEGER,
                panel_power DECIMAL,
                panel_recommendation VARCHAR(100),
                panel_brand VARCHAR(100),
                inverter_power DECIMAL,
                annual_production DECIMAL,
                annual_savings DECIMAL,
                payback_years DECIMAL,
                commission DECIMAL,
                co2_saved DECIMAL,
                required_roof_area DECIMAL,
                company_id INTEGER,
                status VARCHAR(50) DEFAULT 'new',
                manager_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // جدول الشركات
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                city VARCHAR(50),
                address TEXT,
                description TEXT,
                rating DECIMAL DEFAULT 0,
                projects_count INTEGER DEFAULT 0,
                logo TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // جدول ربط الشركات بالطلبات
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lead_companies (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                assigned_by INTEGER NOT NULL REFERENCES managers(id),
                price DECIMAL,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // جدول تعيينات المديرين
        await pool.query(`
            CREATE TABLE IF NOT EXISTS manager_assignments (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                manager_id INTEGER NOT NULL REFERENCES managers(id),
                assigned_by INTEGER NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT
            )
        `);
        
        // جدول أسباب الرفض
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lead_rejections (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL REFERENCES leads(id),
                rejected_by INTEGER NOT NULL,
                reason TEXT,
                rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Database tables created successfully');
        
        // إضافة البيانات الافتراضية
        await seedDatabase();
        
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    }
}

// إضافة البيانات الافتراضية
async function seedDatabase() {
    try {
        // إنشاء حساب الأدمن
        const adminEmail = 'shamsi.tns@gmail.com';
        const adminPassword = 'Levis1992*&';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        const adminResult = await pool.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (adminResult.rows.length === 0) {
            await pool.query(
                'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
                ['Shamsi TN', adminEmail, hashedAdminPassword]
            );
            console.log('✅ Admin account created');
        }
        
        // إنشاء مدير تجريبي
        const managerEmail = 'manager@shamsi.tn';
        const managerPassword = 'manager123';
        const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);
        
        const managerResult = await pool.query('SELECT * FROM managers WHERE email = $1', [managerEmail]);
        if (managerResult.rows.length === 0) {
            await pool.query(
                'INSERT INTO managers (name, email, password, phone, company_name, city) VALUES ($1, $2, $3, $4, $5, $6)',
                ['مدير تجريبي', managerEmail, hashedManagerPassword, '12345678', 'شركة الطاقة الشمسية', 'تونس']
            );
            console.log('✅ Manager account created');
        }
        
        // إنشاء شركات تجريبية
        const companies = [
            ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية', 4.8, 120],
            ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة', 4.7, 95],
            ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان', 4.9, 150]
        ];
        
        for (const company of companies) {
            const result = await pool.query('SELECT * FROM companies WHERE email = $1', [company[1]]);
            if (result.rows.length === 0) {
                await pool.query(
                    'INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    company
                );
                console.log(`✅ Company added: ${company[0]}`);
            }
        }
        
        console.log('✅ Database seeding completed');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

// تصدير pool للاستخدام في المشروع
module.exports = {
    query: (text, params) => pool.query(text, params),
    execute: (text, params) => pool.query(text, params),
    pool: pool
};