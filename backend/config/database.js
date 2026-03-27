const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// إنشاء مجلد البيانات
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('📁 Created data directory');
}

const dbPath = path.join(dataDir, 'shamsi.db');
console.log('📁 Database path:', dbPath);

// إنشاء اتصال SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ SQLite database connected successfully');
    }
});

// تهيئة قاعدة البيانات - إنشاء الجداول
db.serialize(() => {
    // =============================================
    // جدول الأدمن
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // =============================================
    // جدول المديرين
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS managers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        company_name TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // =============================================
    // جدول العملاء (محدث)
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS leads (
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
    
    // =============================================
    // جدول الشركات (جديد)
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS companies (
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
    
    // =============================================
    // جدول ربط الشركات بالطلبات (جديد)
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS lead_companies (
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
        FOREIGN KEY (assigned_by) REFERENCES managers(id)
    )`);
    
    // =============================================
    // جدول تعيينات المديرين
    // =============================================
    db.run(`CREATE TABLE IF NOT EXISTS manager_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        manager_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        notes TEXT
    )`);
    
    console.log('\n✅ Database tables created successfully');
    
    // =============================================
    // إنشاء حساب الأدمن الخاص بك تلقائياً
    // =============================================
    const yourAdmin = {
        name: 'Shamsi TN',
        email: 'shamsi.tns@gmail.com',
        password: 'Levis1992*&'
    };
    
    const hashedPassword = bcrypt.hashSync(yourAdmin.password, 10);
    
    db.get('SELECT * FROM admins WHERE email = ?', [yourAdmin.email], (err, row) => {
        if (err) {
            console.error('❌ Error checking admin:', err.message);
        } else if (!row) {
            db.run('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                [yourAdmin.name, yourAdmin.email, hashedPassword],
                function(err) {
                    if (err) {
                        console.error('❌ Error creating admin:', err.message);
                    } else {
                        console.log('\n╔════════════════════════════════════════════╗');
                        console.log('║     ✅ تم إنشاء حساب الأدمن بنجاح         ║');
                        console.log('╚════════════════════════════════════════════╝');
                        console.log(`   📧 Email: ${yourAdmin.email}`);
                        console.log(`   🔑 Password: ${yourAdmin.password}`);
                        console.log('   👤 Name: Shamsi TN\n');
                    }
                }
            );
        } else {
            console.log('\nℹ️  حساب الأدمن موجود مسبقاً');
            console.log(`   📧 Email: ${yourAdmin.email}`);
            console.log('   🔑 Password: Levis1992*&');
            console.log('   💡 يمكنك تسجيل الدخول مباشرة\n');
        }
    });
    
    // =============================================
    // إنشاء مدير تجريبي
    // =============================================
    const defaultManager = {
        name: 'مدير تجريبي',
        email: 'manager@shamsi.tn',
        password: 'manager123',
        phone: '12345678',
        company_name: 'شركة الطاقة الشمسية',
        city: 'تونس'
    };
    
    const hashedManagerPassword = bcrypt.hashSync(defaultManager.password, 10);
    
    db.get('SELECT * FROM managers WHERE email = ?', [defaultManager.email], (err, row) => {
        if (err) {
            console.error('❌ Error checking manager:', err.message);
        } else if (!row) {
            db.run(`INSERT INTO managers (name, email, password, phone, company_name, city) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                [defaultManager.name, defaultManager.email, hashedManagerPassword, 
                 defaultManager.phone, defaultManager.company_name, defaultManager.city],
                function(err) {
                    if (!err && this.changes > 0) {
                        console.log('✅ تم إنشاء حساب مدير تجريبي:');
                        console.log('   📧 Email: manager@shamsi.tn');
                        console.log('   🔑 Password: manager123\n');
                    }
                }
            );
        } else {
            console.log('ℹ️  حساب المدير التجريبي موجود مسبقاً\n');
        }
    });
    
    // =============================================
    // إنشاء شركات تجريبية
    // =============================================
    const companies = [
        {
            name: 'شركة الطاقة الشمسية تونس',
            email: 'contact@solar-tunisie.com',
            password: 'solar123',
            phone: '71234567',
            city: 'تونس',
            description: 'متخصصون في تركيب الأنظمة الشمسية للمنازل والشركات',
            rating: 4.8,
            projects_count: 120
        },
        {
            name: 'Solar Tunisie',
            email: 'info@solartunisie.tn',
            password: 'solar123',
            phone: '74234567',
            city: 'صفاقس',
            description: 'خدمة ممتازة وأسعار منافسة في الجنوب التونسي',
            rating: 4.7,
            projects_count: 95
        },
        {
            name: 'Green Energy Tunisia',
            email: 'contact@greenenergy.tn',
            password: 'solar123',
            phone: '73234567',
            city: 'سوسة',
            description: 'أفضل جودة وأطول ضمان في السوق التونسية',
            rating: 4.9,
            projects_count: 150
        }
    ];
    
    for (const company of companies) {
        const hashedCompanyPassword = bcrypt.hashSync(company.password, 10);
        db.get('SELECT * FROM companies WHERE email = ?', [company.email], (err, row) => {
            if (err) {
                console.error('❌ Error checking company:', err.message);
            } else if (!row) {
                db.run(`INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [company.name, company.email, hashedCompanyPassword, company.phone, company.city, company.description, company.rating, company.projects_count],
                    function(err) {
                        if (!err && this.changes > 0) {
                            console.log(`✅ Company added: ${company.name}`);
                        }
                    }
                );
            }
        });
    }
});

// =============================================
// تصدير الدوال للاستخدام في المشروع
// =============================================

const dbAPI = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Query error:', err);
                    reject(err);
                } else {
                    resolve([rows]);
                }
            });
        });
    },
    
    execute: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Execute error:', err);
                    reject(err);
                } else {
                    resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
                }
            });
        });
    },
    
    getConnection: () => {
        return {
            query: dbAPI.query,
            execute: dbAPI.execute,
            release: () => {}
        };
    }
};

module.exports = dbAPI;