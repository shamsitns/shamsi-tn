const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// تحديد نوع قاعدة البيانات حسب البيئة
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;

if (isProduction) {
    // =============================================
    // استخدام PostgreSQL على Render (Production)
    // =============================================
    const { Pool } = require('pg');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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
            createTablesPostgres(pool);
        }
    });
    
    async function createTablesPostgres(pool) {
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
            
            console.log('✅ PostgreSQL tables created successfully');
            
            // إضافة البيانات الافتراضية
            await seedDatabasePostgres(pool);
            
        } catch (error) {
            console.error('❌ Error creating tables:', error);
        }
    }
    
    async function seedDatabasePostgres(pool) {
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
    
    db = {
        query: (text, params) => pool.query(text, params),
        execute: (text, params) => pool.query(text, params),
        pool: pool
    };
    
} else {
    // =============================================
    // استخدام SQLite محلياً (Development)
    // =============================================
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs');
    
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'shamsi.db');
    console.log('📁 Local SQLite database path:', dbPath);
    
    const sqlite = new sqlite3.Database(dbPath);
    
    sqlite.serialize(() => {
        // إنشاء الجداول (نفس الهيكل مع تعديلات SQLite)
        sqlite.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS managers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            company_name TEXT,
            city TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            city TEXT NOT NULL,
            property_type TEXT DEFAULT 'house',
            payment_method TEXT DEFAULT 'cash',
            monthly_bill REAL NOT NULL,
            monthly_consumption REAL,
            meter_owner INTEGER DEFAULT 1,
            meter_number TEXT,
            roof_area REAL,
            roof_direction TEXT DEFAULT 'جنوب',
            roof_type TEXT DEFAULT 'مسطح',
            shading TEXT DEFAULT 'لا يوجد',
            required_kw REAL,
            estimated_price REAL,
            panels INTEGER,
            panel_power REAL,
            panel_recommendation TEXT,
            panel_brand TEXT,
            inverter_power REAL,
            annual_production REAL,
            annual_savings REAL,
            payback_years REAL,
            commission REAL,
            co2_saved REAL,
            required_roof_area REAL,
            company_id INTEGER,
            status TEXT DEFAULT 'new',
            manager_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            city TEXT,
            address TEXT,
            description TEXT,
            rating REAL DEFAULT 0,
            projects_count INTEGER DEFAULT 0,
            logo TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS lead_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            assigned_by INTEGER NOT NULL,
            price REAL,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS manager_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            manager_id INTEGER NOT NULL,
            assigned_by INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            notes TEXT
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS lead_rejections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            rejected_by INTEGER NOT NULL,
            reason TEXT,
            rejected_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('✅ SQLite tables created successfully');
        
        // إضافة البيانات الافتراضية
        seedDatabaseSQLite(sqlite);
    });
    
    function seedDatabaseSQLite(sqlite) {
        // إنشاء حساب الأدمن
        const adminEmail = 'shamsi.tns@gmail.com';
        const adminPassword = 'Levis1992*&';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        sqlite.get('SELECT * FROM admins WHERE email = ?', [adminEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                    ['Shamsi TN', adminEmail, hashedAdminPassword]);
                console.log('✅ Admin account created');
            }
        });
        
        // إنشاء مدير تجريبي
        const managerEmail = 'manager@shamsi.tn';
        const managerPassword = 'manager123';
        const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);
        
        sqlite.get('SELECT * FROM managers WHERE email = ?', [managerEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO managers (name, email, password, phone, company_name, city) VALUES (?, ?, ?, ?, ?, ?)',
                    ['مدير تجريبي', managerEmail, hashedManagerPassword, '12345678', 'شركة الطاقة الشمسية', 'تونس']);
                console.log('✅ Manager account created');
            }
        });
        
        // إنشاء شركات تجريبية
        const companies = [
            ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية', 4.8, 120],
            ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة', 4.7, 95],
            ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان', 4.9, 150]
        ];
        
        for (const company of companies) {
            sqlite.get('SELECT * FROM companies WHERE email = ?', [company[1]], (err, row) => {
                if (!row) {
                    sqlite.run('INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', company);
                    console.log(`✅ Company added: ${company[0]}`);
                }
            });
        }
        
        console.log('✅ Database seeding completed');
    }
    
    db = {
        query: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                sqlite.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows: rows });
                });
            });
        },
        execute: (sql, params = []) => {
            return new Promise((resolve, reject) => {
                sqlite.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ rows: [], insertId: this.lastID, affectedRows: this.changes });
                });
            });
        }
    };
}

module.exports = db;