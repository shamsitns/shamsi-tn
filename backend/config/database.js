const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// إنشاء مجلد البيانات
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

const dbPath = path.join(dataDir, 'shamsi.db');
console.log('📁 Database path:', dbPath);

// إنشاء اتصال SQLite باستخدام better-sqlite3
const db = new Database(dbPath);

// تمكين المفاتيح الخارجية
db.pragma('foreign_keys = ON');

console.log('✅ SQLite database connected successfully');

// تهيئة قاعدة البيانات - إنشاء الجداول
db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS managers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        company_name TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
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
    );

    CREATE TABLE IF NOT EXISTS companies (
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
    );

    CREATE TABLE IF NOT EXISTS lead_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        price REAL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        manager_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        notes TEXT
    );
`);

console.log('✅ Database tables created successfully');

// إنشاء حساب الأدمن
const adminEmail = 'shamsi.tns@gmail.com';
const adminPassword = 'Levis1992*&';
const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);

const existingAdmin = db.prepare('SELECT * FROM admins WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
    db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)').run('Shamsi TN', adminEmail, hashedAdminPassword);
    console.log('✅ Admin account created');
}

// إنشاء مدير تجريبي
const managerEmail = 'manager@shamsi.tn';
const managerPassword = 'manager123';
const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);

const existingManager = db.prepare('SELECT * FROM managers WHERE email = ?').get(managerEmail);
if (!existingManager) {
    db.prepare('INSERT INTO managers (name, email, password, phone, company_name, city) VALUES (?, ?, ?, ?, ?, ?)')
        .run('مدير تجريبي', managerEmail, hashedManagerPassword, '12345678', 'شركة الطاقة الشمسية', 'تونس');
    console.log('✅ Manager account created');
}

// إنشاء شركات تجريبية
const companies = [
    { name: 'شركة الطاقة الشمسية تونس', email: 'contact@solar-tunisie.com', password: 'solar123', phone: '71234567', city: 'تونس', description: 'متخصصون في تركيب الأنظمة الشمسية', rating: 4.8, projects_count: 120 },
    { name: 'Solar Tunisie', email: 'info@solartunisie.tn', password: 'solar123', phone: '74234567', city: 'صفاقس', description: 'خدمة ممتازة وأسعار منافسة', rating: 4.7, projects_count: 95 },
    { name: 'Green Energy Tunisia', email: 'contact@greenenergy.tn', password: 'solar123', phone: '73234567', city: 'سوسة', description: 'أفضل جودة وأطول ضمان', rating: 4.9, projects_count: 150 }
];

for (const company of companies) {
    const existing = db.prepare('SELECT * FROM companies WHERE email = ?').get(company.email);
    if (!existing) {
        const hashed = bcrypt.hashSync(company.password, 10);
        db.prepare('INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(company.name, company.email, hashed, company.phone, company.city, company.description, company.rating, company.projects_count);
        console.log(`✅ Company added: ${company.name}`);
    }
}

// =============================================
// تصدير الدوال للاستخدام في المشروع
// =============================================

const dbAPI = {
    query: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            const rows = stmt.all(...params);
            return [rows];
        } catch (error) {
            console.error('❌ Query error:', error);
            throw error;
        }
    },
    execute: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            const info = stmt.run(...params);
            return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
        } catch (error) {
            console.error('❌ Execute error:', error);
            throw error;
        }
    },
    get: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            return stmt.get(...params);
        } catch (error) {
            console.error('❌ Get error:', error);
            throw error;
        }
    },
    all: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            return stmt.all(...params);
        } catch (error) {
            console.error('❌ All error:', error);
            throw error;
        }
    }
};

module.exports = dbAPI;