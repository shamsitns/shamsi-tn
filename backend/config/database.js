const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let db = null;
let dbType = 'sqlite'; // default

// Initialize database based on environment
const initDatabase = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  // تحقق من وجود PostgreSQL في الإنتاج
  const usePostgres = isProduction && databaseUrl && 
    (databaseUrl.includes('postgres') || databaseUrl.includes('postgresql'));

  if (usePostgres) {
    // PostgreSQL for production
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
    // SQLite for development only
    console.log('📦 Using SQLite for development');
    dbType = 'sqlite';
    
    // فقط ثبت sqlite3 في حالة التطوير المحلي
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
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center', 'admin')),
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
      additional_info TEXT,
      required_kw DECIMAL(10,2),
      panels_count INTEGER,
      commission_amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'completed', 'cancelled')),
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
    
    `CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS lead_companies (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      assigned_by INTEGER REFERENCES users(id),
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending'
    )`,
    
    `CREATE TABLE IF NOT EXISTS manager_assignments (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      manager_id INTEGER REFERENCES users(id),
      assigned_by INTEGER REFERENCES users(id),
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
    await pool.query(query);
  }
  
  await insertDefaultUsersPostgres(pool);
};

// SQLite table creation
const createTablesSQLite = async (db) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK (role IN ('owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center', 'admin')),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      additional_info TEXT,
      required_kw REAL,
      panels_count INTEGER,
      commission_amount REAL,
      status TEXT DEFAULT 'pending',
      created_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      approved_at DATETIME,
      contacted_by INTEGER REFERENCES users(id),
      contacted_at DATETIME,
      sent_to_operations_by INTEGER REFERENCES users(id),
      sent_to_operations_at DATETIME,
      assigned_company_id INTEGER REFERENCES companies(id),
      assigned_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS lead_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      assigned_by INTEGER REFERENCES users(id),
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending'
    )`,
    
    `CREATE TABLE IF NOT EXISTS manager_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      manager_id INTEGER REFERENCES users(id),
      assigned_by INTEGER REFERENCES users(id),
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    { email: 'shamsi.tns@gmail.com', password: 'Levis1992*&', name: 'Owner Shamsi', role: 'owner' },
    { email: 'gm@shamsi.tn', password: 'gm123', name: 'General Manager', role: 'general_manager' },
    { email: 'manager@shamsi.tn', password: 'manager123', name: 'Executive Manager', role: 'executive_manager' },
    { email: 'operations@shamsi.tn', password: 'operations123', name: 'Operations Manager', role: 'operations_manager' },
    { email: 'callcenter@shamsi.tn', password: 'call123', name: 'Call Center', role: 'call_center' },
    { email: 'admin@shamsi.tn', password: 'admin123', name: 'Admin', role: 'admin' }
  ];
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      [user.email, hashedPassword, user.name, user.role]
    );
  }
  console.log('✅ Default users inserted');
};

// Insert default users for SQLite
const insertDefaultUsersSQLite = async (db) => {
  const users = [
    { email: 'shamsi.tns@gmail.com', password: 'Levis1992*&', name: 'Owner Shamsi', role: 'owner' },
    { email: 'gm@shamsi.tn', password: 'gm123', name: 'General Manager', role: 'general_manager' },
    { email: 'manager@shamsi.tn', password: 'manager123', name: 'Executive Manager', role: 'executive_manager' },
    { email: 'operations@shamsi.tn', password: 'operations123', name: 'Operations Manager', role: 'operations_manager' },
    { email: 'callcenter@shamsi.tn', password: 'call123', name: 'Call Center', role: 'call_center' },
    { email: 'admin@shamsi.tn', password: 'admin123', name: 'Admin', role: 'admin' }
  ];
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.run(
      `INSERT OR IGNORE INTO users (email, password, name, role) 
       VALUES (?, ?, ?, ?)`,
      [user.email, hashedPassword, user.name, user.role]
    );
  }
  console.log('✅ Default users inserted');
};

// Query function that works for both PostgreSQL and SQLite
const query = async (text, params = []) => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  
  if (dbType === 'postgres') {
    return db.query(text, params);
  } else {
    // SQLite
    if (text.toLowerCase().includes('select')) {
      const rows = await db.all(text, params);
      return { rows };
    } else {
      const result = await db.run(text, params);
      return { rows: [], lastID: result.lastID, changes: result.changes };
    }
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
  getDbType
};
