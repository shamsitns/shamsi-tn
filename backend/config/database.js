const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let db = null;
let dbType = 'sqlite';

// Initialize database based on environment
const initDatabase = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  const usePostgres = isProduction && databaseUrl && 
    (databaseUrl.includes('postgres') || databaseUrl.includes('postgresql'));

  if (usePostgres) {
    console.log('✅ Using PostgreSQL for production');
    dbType = 'postgres';
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
      process.exit(-1);
    });

    db = pool;
    await createTablesPostgres(pool);
    console.log('✅ PostgreSQL connected successfully');
    return db;
  } else {
    console.log('📦 Using SQLite for development');
    dbType = 'sqlite';
    
    const sqlite3 = require('sqlite3').verbose();
    const { open } = require('sqlite');
    
    const sqliteDb = await open({
      filename: path.join(__dirname, '../../shamsi.db'),
      driver: sqlite3.Database
    });
    
    db = sqliteDb;
    await createTablesSQLite(sqliteDb);
    console.log('✅ SQLite connected');
    return db;
  }
};

// PostgreSQL table creation
const createTablesPostgres = async (pool) => {
  console.log('🔄 Creating all tables with correct structure...');

  // ============================================
  // 1. إضافة الأعمدة المفقودة إلى الجداول الموجودة
  // ============================================
  
  // إضافة أعمدة users
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);`);
    console.log('✅ Updated users table');
  } catch (err) {
    console.log('Note: users table update:', err.message);
  }

  // ✅ حذف عمود password من companies إذا كان موجوداً
  try {
    await pool.query(`ALTER TABLE companies DROP COLUMN IF EXISTS password;`);
    console.log('✅ Removed password column from companies table');
  } catch (err) {
    console.log('Note: could not drop password column:', err.message);
  }

  // إضافة جميع أعمدة leads المفقودة
  try {
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_bank VARCHAR(100);`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS panel_type VARCHAR(100);`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'website';`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_area DECIMAL(10,2);`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_number VARCHAR(50);`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS financing_type VARCHAR(20) DEFAULT 'cash';`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS installation_status VARCHAR(50) DEFAULT 'pending';`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);`);
    console.log('✅ Updated leads table with all columns');
  } catch (err) {
    console.log('Note: leads table update:', err.message);
  }

  // إضافة أعمدة companies
  try {
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS projects_completed INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);`);
    await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo VARCHAR(500);`);
    console.log('✅ Updated companies table with all columns');
  } catch (err) {
    console.log('Note: companies table update:', err.message);
  }

  // ✅ إضافة عمود commission_rate إلى lead_companies
  try {
    await pool.query(`ALTER TABLE lead_companies ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10,2) DEFAULT 0;`);
    console.log('✅ Added commission_rate column to lead_companies');
  } catch (err) {
    console.log('Note: could not add commission_rate column:', err.message);
  }

  // ============================================
  // 2. إنشاء الجداول الجديدة
  // ============================================
  
  const newTables = [
    `CREATE TABLE IF NOT EXISTS lead_history (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      old_status VARCHAR(50),
      new_status VARCHAR(50),
      changed_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      lead_id INTEGER REFERENCES leads(id),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS solar_calculations (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id),
      required_kw DECIMAL(10,2),
      panels_count INTEGER,
      annual_production DECIMAL(10,2),
      annual_savings DECIMAL(10,2),
      roof_needed DECIMAL(10,2),
      co2_reduction DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of newTables) {
    try {
      await pool.query(query);
      console.log('✅ Created new table');
    } catch (err) {
      console.log('Note: could not create table:', err.message);
    }
  }

  // ============================================
  // 3. إنشاء الفهارس الجديدة
  // ============================================
  
  const newIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_assigned_company ON leads(assigned_company_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_meter_number ON leads(meter_number)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`,
    `CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON lead_history(lead_id)`
  ];

  for (const query of newIndexes) {
    try {
      await pool.query(query);
    } catch (err) {
      console.log('Note: could not create index:', err.message);
    }
  }

  // ============================================
  // 4. إنشاء الجداول الرئيسية (إذا لم تكن موجودة)
  // ============================================
  
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center', 'admin', 'company')),
      company_id INTEGER REFERENCES companies(id),
      is_active BOOLEAN DEFAULT true,
      must_change_password BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      rating DECIMAL(2,1) DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      projects_completed INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      city VARCHAR(100),
      property_type VARCHAR(50) NOT NULL,
      bill_amount DECIMAL(10,2) NOT NULL,
      bill_period_months INTEGER NOT NULL,
      bill_season VARCHAR(20),
      roof_availability BOOLEAN DEFAULT true,
      roof_area DECIMAL(10,2),
      meter_number VARCHAR(50),
      payment_method VARCHAR(50),
      preferred_bank VARCHAR(100),
      panel_type VARCHAR(100),
      lead_source VARCHAR(50) DEFAULT 'website',
      financing_type VARCHAR(20) DEFAULT 'cash' CHECK (financing_type IN ('cash', 'prosol', 'leasing')),
      lead_score INTEGER DEFAULT 0,
      additional_info TEXT,
      required_kw DECIMAL(10,2),
      panels_count INTEGER,
      commission_amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'installation_in_progress', 'completed', 'cancelled')),
      installation_status VARCHAR(50) DEFAULT 'pending',
      created_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMP,
      contacted_by INTEGER REFERENCES users(id),
      contacted_at TIMESTAMP,
      sent_to_operations_by INTEGER REFERENCES users(id),
      sent_to_operations_at TIMESTAMP,
      assigned_company_id INTEGER REFERENCES companies(id),
      assigned_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS lead_companies (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      assigned_by INTEGER REFERENCES users(id),
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      commission_rate DECIMAL(10,2) DEFAULT 0
    )`,
    
    `CREATE TABLE IF NOT EXISTS manager_assignments (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      assigned_by INTEGER REFERENCES users(id),
      notes TEXT,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(255),
      details TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS commissions (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id),
      amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`
  ];
  
  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (err) {
      console.error('Error creating table:', err.message);
    }
  }
  
  console.log('✅ All tables created successfully');
  await insertDefaultUsersPostgres(pool);
};

// SQLite version (simplified for development)
const createTablesSQLite = async (db) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      company_id INTEGER,
      is_active INTEGER DEFAULT 1,
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      rating REAL DEFAULT 0,
      projects_completed INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      city TEXT,
      property_type TEXT NOT NULL,
      bill_amount REAL NOT NULL,
      bill_period_months INTEGER NOT NULL,
      bill_season TEXT,
      roof_availability INTEGER DEFAULT 1,
      roof_area REAL,
      meter_number TEXT,
      payment_method TEXT,
      preferred_bank TEXT,
      panel_type TEXT,
      lead_source TEXT DEFAULT 'website',
      financing_type TEXT DEFAULT 'cash',
      lead_score INTEGER DEFAULT 0,
      additional_info TEXT,
      required_kw REAL,
      panels_count INTEGER,
      commission_amount REAL,
      status TEXT DEFAULT 'pending',
      installation_status TEXT DEFAULT 'pending',
      created_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      approved_at DATETIME,
      assigned_company_id INTEGER REFERENCES companies(id),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      changed_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      lead_id INTEGER REFERENCES leads(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id),
      amount REAL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  for (const query of queries) {
    await db.exec(query);
  }
  
  await insertDefaultUsersSQLite(db);
};

// Insert default users for PostgreSQL
const insertDefaultUsersPostgres = async (pool) => {
  const users = [
    { email: 'shamsi.tns@gmail.com', password: 'Levis1992*&', name: 'Owner Shamsi', role: 'owner', must_change_password: false },
    { email: 'gm@shamsi.tn', password: 'gm123', name: 'General Manager', role: 'general_manager', must_change_password: true },
    { email: 'manager@shamsi.tn', password: 'manager123', name: 'Executive Manager', role: 'executive_manager', must_change_password: true },
    { email: 'operations@shamsi.tn', password: 'operations123', name: 'Operations Manager', role: 'operations_manager', must_change_password: true },
    { email: 'callcenter@shamsi.tn', password: 'call123', name: 'Call Center', role: 'call_center', must_change_password: true },
    { email: 'admin@shamsi.tn', password: 'admin123', name: 'Admin', role: 'admin', must_change_password: true }
  ];
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (email, password, name, role, must_change_password) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING`,
      [user.email, hashedPassword, user.name, user.role, user.must_change_password]
    );
  }
  console.log('✅ Default users inserted');
};

// Insert default users for SQLite
const insertDefaultUsersSQLite = async (db) => {
  const users = [
    { email: 'shamsi.tns@gmail.com', password: 'Levis1992*&', name: 'Owner Shamsi', role: 'owner', must_change_password: 0 },
    { email: 'gm@shamsi.tn', password: 'gm123', name: 'General Manager', role: 'general_manager', must_change_password: 1 },
    { email: 'manager@shamsi.tn', password: 'manager123', name: 'Executive Manager', role: 'executive_manager', must_change_password: 1 },
    { email: 'operations@shamsi.tn', password: 'operations123', name: 'Operations Manager', role: 'operations_manager', must_change_password: 1 },
    { email: 'callcenter@shamsi.tn', password: 'call123', name: 'Call Center', role: 'call_center', must_change_password: 1 },
    { email: 'admin@shamsi.tn', password: 'admin123', name: 'Admin', role: 'admin', must_change_password: 1 }
  ];
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.run(
      `INSERT OR IGNORE INTO users (email, password, name, role, must_change_password) 
       VALUES (?, ?, ?, ?, ?)`,
      [user.email, hashedPassword, user.name, user.role, user.must_change_password]
    );
  }
  console.log('✅ Default users inserted');
};

// Improved query function
const query = async (text, params = []) => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  const trimmedQuery = text.trim().toLowerCase();
  const isSelectQuery = trimmedQuery.startsWith('select') || 
                        trimmedQuery.startsWith('with') || 
                        trimmedQuery.includes('returning');
  
  if (dbType === 'postgres') {
    return db.query(text, params);
  } else {
    if (isSelectQuery) {
      const rows = await db.all(text, params);
      return { rows };
    } else {
      const result = await db.run(text, params);
      return { rows: [], lastID: result.lastID, changes: result.changes };
    }
  }
};

// Helper to add lead history
const addLeadHistory = async (leadId, action, oldStatus, newStatus, userId, notes = null) => {
  try {
    await query(
      `INSERT INTO lead_history (lead_id, action, old_status, new_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [leadId, action, oldStatus, newStatus, userId, notes]
    );
  } catch (err) {
    console.error('Error adding lead history:', err);
  }
};

// Helper to add notification
const addNotification = async (userId, leadId, title, message, type = 'info') => {
  try {
    await query(
      `INSERT INTO notifications (user_id, lead_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, leadId, title, message, type]
    );
  } catch (err) {
    console.error('Error adding notification:', err);
  }
};

// Get database instance
const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Get database type
const getDbType = () => dbType;

module.exports = {
  initDatabase,
  query,
  getDb,
  getDbType,
  addLeadHistory,
  addNotification
};