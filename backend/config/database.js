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
            // =============================================
            // جدول المستخدمين (الأدوار الجديدة)
            // =============================================
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'executive_manager',
                    phone VARCHAR(20),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // =============================================
            // جدول العملاء (المحدث)
            // =============================================
            await pool.query(`
                CREATE TABLE IF NOT EXISTS leads (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    city VARCHAR(50) NOT NULL,
                    property_type VARCHAR(50) DEFAULT 'house',
                    bill_period INTEGER DEFAULT 60,
                    bill_season VARCHAR(20) DEFAULT 'spring',
                    meter_number VARCHAR(50),
                    bill_value DECIMAL(10,2) NOT NULL,
                    roof_area DECIMAL(10,2),
                    payment_method VARCHAR(50) DEFAULT 'cash',
                    recommended_system DECIMAL(5,2),
                    panels INTEGER,
                    annual_production DECIMAL(10,2),
                    annual_savings DECIMAL(10,2),
                    estimated_price DECIMAL(10,2),
                    commission DECIMAL(10,2),
                    monthly_installment DECIMAL(10,2),
                    co2_saved INTEGER,
                    required_roof_area DECIMAL(10,2),
                    adjusted_annual_consumption DECIMAL(10,2),
                    status VARCHAR(50) DEFAULT 'new',
                    assigned_to INTEGER,
                    notes TEXT,
                    documents_received BOOLEAN DEFAULT false,
                    devis_price DECIMAL(10,2),
                    devis_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
                )
            `);
            
            // =============================================
            // جدول العمولات
            // =============================================
            await pool.query(`
                CREATE TABLE IF NOT EXISTS commissions (
                    id SERIAL PRIMARY KEY,
                    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                    manager_id INTEGER NOT NULL REFERENCES users(id),
                    amount DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    paid_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // =============================================
            // جدول سجل النشاطات
            // =============================================
            await pool.query(`
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(100) NOT NULL,
                    lead_id INTEGER REFERENCES leads(id),
                    details TEXT,
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // =============================================
            // جداول قديمة (للتوافق مع الكود الحالي)
            // =============================================
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS managers (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    company_name VARCHAR(100),
                    city VARCHAR(50),
                    role VARCHAR(50) DEFAULT 'executive',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
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
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS lead_companies (
                    id SERIAL PRIMARY KEY,
                    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    assigned_by INTEGER NOT NULL REFERENCES users(id),
                    price DECIMAL,
                    notes TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS manager_assignments (
                    id SERIAL PRIMARY KEY,
                    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
                    manager_id INTEGER NOT NULL REFERENCES users(id),
                    assigned_by INTEGER NOT NULL REFERENCES users(id),
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'pending',
                    notes TEXT
                )
            `);
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS lead_rejections (
                    id SERIAL PRIMARY KEY,
                    lead_id INTEGER NOT NULL REFERENCES leads(id),
                    rejected_by INTEGER NOT NULL REFERENCES users(id),
                    reason TEXT,
                    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ All tables created successfully');
            
            // إضافة البيانات الافتراضية
            await seedDatabasePostgres(pool);
            
        } catch (error) {
            console.error('❌ Error creating tables:', error);
        }
    }
    
    async function seedDatabasePostgres(pool) {
        try {
            // =============================================
            // إنشاء المستخدمين حسب الأدوار
            // =============================================
            
            // المالك (Owner)
            const ownerEmail = 'shamsi.tns@gmail.com';
            const ownerPassword = 'Levis1992*&';
            const hashedOwnerPassword = bcrypt.hashSync(ownerPassword, 10);
            
            const ownerResult = await pool.query('SELECT * FROM users WHERE email = $1', [ownerEmail]);
            if (ownerResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                    ['مالك المنصة', ownerEmail, hashedOwnerPassword, 'owner', '24661499']
                );
                console.log('✅ Owner account created');
            }
            
            // المدير العام (General Manager)
            const gmEmail = 'gm@shamsi.tn';
            const gmPassword = 'gm123';
            const hashedGmPassword = bcrypt.hashSync(gmPassword, 10);
            
            const gmResult = await pool.query('SELECT * FROM users WHERE email = $1', [gmEmail]);
            if (gmResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                    ['مدير عام', gmEmail, hashedGmPassword, 'general_manager', '24661499']
                );
                console.log('✅ General Manager account created');
            }
            
            // المدير التنفيذي (Executive Manager)
            const execEmail = 'manager@shamsi.tn';
            const execPassword = 'manager123';
            const hashedExecPassword = bcrypt.hashSync(execPassword, 10);
            
            const execResult = await pool.query('SELECT * FROM users WHERE email = $1', [execEmail]);
            if (execResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                    ['محمد إبراهيم الحصايري', execEmail, hashedExecPassword, 'executive_manager', '29593641']
                );
                console.log('✅ Executive Manager account created');
            }
            
            // مدير العمليات (Operations Manager)
            const opsEmail = 'operations@shamsi.tn';
            const opsPassword = 'operations123';
            const hashedOpsPassword = bcrypt.hashSync(opsPassword, 10);
            
            const opsResult = await pool.query('SELECT * FROM users WHERE email = $1', [opsEmail]);
            if (opsResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                    ['أحمد شبوح', opsEmail, hashedOpsPassword, 'operations_manager', '50575558']
                );
                console.log('✅ Operations Manager account created');
            }
            
            // مركز الاتصال (Call Center)
            const callEmail = 'callcenter@shamsi.tn';
            const callPassword = 'call123';
            const hashedCallPassword = bcrypt.hashSync(callPassword, 10);
            
            const callResult = await pool.query('SELECT * FROM users WHERE email = $1', [callEmail]);
            if (callResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                    ['مركز الاتصال', callEmail, hashedCallPassword, 'call_center', '24661499']
                );
                console.log('✅ Call Center account created');
            }
            
            // =============================================
            // الحفاظ على الحسابات القديمة للتوافق
            // =============================================
            
            const adminEmail = 'admin@shamsi.tn';
            const adminPassword = 'admin123';
            const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
            
            const adminResult = await pool.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
            if (adminResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
                    ['Admin Shamsi', adminEmail, hashedAdminPassword]
                );
                console.log('✅ Admin account created');
            }
            
            // =============================================
            // إنشاء شركات تجريبية
            // =============================================
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
            
            console.log('\n✅ Database seeding completed');
            console.log('\n📋 Accounts:');
            console.log('   Owner (مالك): shamsi.tns@gmail.com / Levis1992*&');
            console.log('   General Manager (مدير عام): gm@shamsi.tn / gm123');
            console.log('   Executive Manager (مدير تنفيذي): manager@shamsi.tn / manager123');
            console.log('   Operations Manager (مدير عمليات): operations@shamsi.tn / operations123');
            console.log('   Call Center (مركز اتصال): callcenter@shamsi.tn / call123');
            console.log('   Admin (قديم): admin@shamsi.tn / admin123\n');
            
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
        sqlite.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'executive_manager',
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            city TEXT NOT NULL,
            property_type TEXT DEFAULT 'house',
            bill_period INTEGER DEFAULT 60,
            bill_season TEXT DEFAULT 'spring',
            meter_number TEXT,
            bill_value REAL NOT NULL,
            roof_area REAL,
            payment_method TEXT DEFAULT 'cash',
            recommended_system REAL,
            panels INTEGER,
            annual_production REAL,
            annual_savings REAL,
            estimated_price REAL,
            commission REAL,
            monthly_installment REAL,
            co2_saved INTEGER,
            required_roof_area REAL,
            adjusted_annual_consumption REAL,
            status TEXT DEFAULT 'new',
            assigned_to INTEGER,
            notes TEXT,
            documents_received INTEGER DEFAULT 0,
            devis_price REAL,
            devis_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS commissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            manager_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            FOREIGN KEY (manager_id) REFERENCES users(id)
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            lead_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (lead_id) REFERENCES leads(id)
        )`);
        
        // جداول قديمة للتوافق
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
            role TEXT DEFAULT 'executive',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (assigned_by) REFERENCES users(id)
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS manager_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            manager_id INTEGER NOT NULL,
            assigned_by INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            FOREIGN KEY (manager_id) REFERENCES users(id),
            FOREIGN KEY (assigned_by) REFERENCES users(id)
        )`);
        
        sqlite.run(`CREATE TABLE IF NOT EXISTS lead_rejections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            rejected_by INTEGER NOT NULL,
            reason TEXT,
            rejected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            FOREIGN KEY (rejected_by) REFERENCES users(id)
        )`);
        
        console.log('✅ SQLite tables created successfully');
        
        // إضافة البيانات الافتراضية
        seedDatabaseSQLite(sqlite);
    });
    
    function seedDatabaseSQLite(sqlite) {
        const bcrypt = require('bcryptjs');
        
        // المالك
        const ownerEmail = 'shamsi.tns@gmail.com';
        const ownerPassword = 'Levis1992*&';
        const hashedOwnerPassword = bcrypt.hashSync(ownerPassword, 10);
        
        sqlite.get('SELECT * FROM users WHERE email = ?', [ownerEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                    ['مالك المنصة', ownerEmail, hashedOwnerPassword, 'owner', '24661499']);
                console.log('✅ Owner account created');
            }
        });
        
        // المدير العام
        const gmEmail = 'gm@shamsi.tn';
        const gmPassword = 'gm123';
        const hashedGmPassword = bcrypt.hashSync(gmPassword, 10);
        
        sqlite.get('SELECT * FROM users WHERE email = ?', [gmEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                    ['مدير عام', gmEmail, hashedGmPassword, 'general_manager', '24661499']);
                console.log('✅ General Manager account created');
            }
        });
        
        // المدير التنفيذي
        const execEmail = 'manager@shamsi.tn';
        const execPassword = 'manager123';
        const hashedExecPassword = bcrypt.hashSync(execPassword, 10);
        
        sqlite.get('SELECT * FROM users WHERE email = ?', [execEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                    ['محمد إبراهيم الحصايري', execEmail, hashedExecPassword, 'executive_manager', '29593641']);
                console.log('✅ Executive Manager account created');
            }
        });
        
        // مدير العمليات
        const opsEmail = 'operations@shamsi.tn';
        const opsPassword = 'operations123';
        const hashedOpsPassword = bcrypt.hashSync(opsPassword, 10);
        
        sqlite.get('SELECT * FROM users WHERE email = ?', [opsEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                    ['أحمد شبوح', opsEmail, hashedOpsPassword, 'operations_manager', '50575558']);
                console.log('✅ Operations Manager account created');
            }
        });
        
        // مركز الاتصال
        const callEmail = 'callcenter@shamsi.tn';
        const callPassword = 'call123';
        const hashedCallPassword = bcrypt.hashSync(callPassword, 10);
        
        sqlite.get('SELECT * FROM users WHERE email = ?', [callEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
                    ['مركز الاتصال', callEmail, hashedCallPassword, 'call_center', '24661499']);
                console.log('✅ Call Center account created');
            }
        });
        
        // الأدمن القديم
        const adminEmail = 'admin@shamsi.tn';
        const adminPassword = 'admin123';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        sqlite.get('SELECT * FROM admins WHERE email = ?', [adminEmail], (err, row) => {
            if (!row) {
                sqlite.run('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                    ['Admin Shamsi', adminEmail, hashedAdminPassword]);
                console.log('✅ Admin account created');
            }
        });
        
        // شركات تجريبية
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
        
        console.log('\n✅ Database seeding completed');
        console.log('\n📋 Accounts:');
        console.log('   Owner (مالك): shamsi.tns@gmail.com / Levis1992*&');
        console.log('   General Manager (مدير عام): gm@shamsi.tn / gm123');
        console.log('   Executive Manager (مدير تنفيذي): manager@shamsi.tn / manager123');
        console.log('   Operations Manager (مدير عمليات): operations@shamsi.tn / operations123');
        console.log('   Call Center (مركز اتصال): callcenter@shamsi.tn / call123');
        console.log('   Admin (قديم): admin@shamsi.tn / admin123\n');
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