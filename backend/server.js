const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = '/api';
const startTime = Date.now();

// Import database and routes
const { initDatabase, getDb } = require('./config/database');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const adminRoutes = require('./routes/admin');
const managerRoutes = require('./routes/manager');
const companyRoutes = require('./routes/companies');
const bankRoutes = require('./routes/bank');
const leasingRoutes = require('./routes/leasing');

// =============================================
// التأكد من وجود مجلد data (لـ SQLite على Render)
// =============================================
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// =============================================
// Request ID Middleware (للتتبع والتصحيح)
// =============================================
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// =============================================
// Rate Limiting (لمنع الإساءة)
// =============================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 200, // 200 طلب كحد أقصى
    message: {
        message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(`${API_PREFIX}/`, limiter);

// =============================================
// Middleware (مع تحسينات الأداء)
// =============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression
app.use(compression());

// CORS (محدد حسب البيئة)
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://shamsi.tn', 'https://www.shamsi.tn', 'https://shamsi-tns.onrender.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Logging (مختلف بين التطوير والإنتاج)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing (حدود أصغر للأمان)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cache Control
app.use((req, res, next) => {
    if (req.path.startsWith(API_PREFIX)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
});

// =============================================
// API Routes
// =============================================
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/leads`, leadRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/manager`, managerRoutes);
app.use(`${API_PREFIX}/companies`, companyRoutes);
app.use(`${API_PREFIX}/bank`, bankRoutes);
app.use(`${API_PREFIX}/leasing`, leasingRoutes);

// =============================================
// Health Check
// =============================================
app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Shamsi.tn API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        requestId: req.id,
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
    });
});

// =============================================
// Server Uptime
// =============================================
app.get(`${API_PREFIX}/uptime`, (req, res) => {
    res.json({
        uptime: process.uptime(),
        started_at: new Date(startTime),
        requestId: req.id
    });
});

// =============================================
// ✅ TEMPORARY: Run seed to add executive manager
// =============================================
app.get(`${API_PREFIX}/run-seed`, async (req, res) => {
    try {
        console.log('🌱 Running seed...');
        exec('node seed.js', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Seed error:', error);
                return res.status(500).json({ error: error.message, stderr });
            }
            console.log('✅ Seed completed');
            res.json({ message: 'Seed completed successfully', output: stdout });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ✅ TEMPORARY: Add executive manager manually
// =============================================
app.get(`${API_PREFIX}/add-executive`, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const db = getDb();
        const hashedPassword = await bcrypt.hash('manager123', 10);
        
        const existing = await db.query("SELECT id FROM users WHERE role = 'executive_manager' LIMIT 1");
        const existingRows = existing.rows || existing;
        
        if (existingRows.length > 0) {
            return res.json({ 
                message: 'Executive manager already exists', 
                id: existingRows[0].id,
                note: 'Use this ID when assigning leads'
            });
        }
        
        const result = await db.query(
            `INSERT INTO users (name, email, password, role, is_active, created_at) 
             VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP) 
             RETURNING id`,
            ['Executive Manager', 'executive@shamsi.tn', hashedPassword, 'executive_manager']
        );
        
        const newId = (result.rows || result)[0]?.id;
        res.json({ 
            message: 'Executive manager created successfully', 
            id: newId, 
            email: 'executive@shamsi.tn',
            password: 'manager123',
            note: 'Use this ID when assigning leads'
        });
        
    } catch (error) {
        console.error('Error adding executive:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ✅ TEMPORARY: Fix manager_assignments table
// =============================================
app.get(`${API_PREFIX}/fix-manager-assignments`, async (req, res) => {
    try {
        const db = getDb();
        
        // حذف الجدول القديم
        await db.query('DROP TABLE IF EXISTS manager_assignments CASCADE;');
        console.log('✅ Dropped old manager_assignments table');
        
        // إعادة إنشاء الجدول بالشكل الصحيح
        await db.query(`
            CREATE TABLE IF NOT EXISTS manager_assignments (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
                manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_by INTEGER REFERENCES users(id),
                notes TEXT,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Recreated manager_assignments table with correct foreign key');
        
        res.json({ message: 'manager_assignments table fixed successfully' });
        
    } catch (error) {
        console.error('Error fixing manager_assignments:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// Debug Routes (فقط في بيئة التطوير)
// =============================================
if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Debug routes enabled (development mode only)');
    
    app.get(`${API_PREFIX}/check-leads`, async (req, res) => {
        try {
            const db = getDb();
            const result = await db.query('SELECT id, name, phone, city, required_kw, commission_amount, status, created_at FROM leads ORDER BY id DESC');
            const leads = result.rows || result;
            res.json({ count: leads.length, leads, requestId: req.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get(`${API_PREFIX}/db-stats`, async (req, res) => {
        try {
            const db = getDb();
            const users = await db.query('SELECT COUNT(*) as count FROM users');
            const companies = await db.query('SELECT COUNT(*) as count FROM companies');
            const leads = await db.query('SELECT COUNT(*) as count FROM leads');
            res.json({
                users: (users.rows || users)[0]?.count || 0,
                companies: (companies.rows || companies)[0]?.count || 0,
                leads: (leads.rows || leads)[0]?.count || 0,
                requestId: req.id
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get(`${API_PREFIX}/fix-users`, async (req, res) => {
        try {
            const bcrypt = require('bcryptjs');
            const db = getDb();
            
            const usersToAdd = [
                { name: 'Executive Manager', email: 'executive@shamsi.tn', password: 'manager123', role: 'executive_manager', phone: '29593641' },
                { name: 'Operations Manager', email: 'operations@shamsi.tn', password: 'operations123', role: 'operations_manager', phone: '50575558' },
                { name: 'Call Center', email: 'callcenter@shamsi.tn', password: 'call123', role: 'call_center', phone: '24661499' }
            ];
            
            const results = [];
            
            for (const user of usersToAdd) {
                const existing = await db.query("SELECT id FROM users WHERE email = $1", [user.email]);
                const existingRows = existing.rows || existing;
                
                if (existingRows.length > 0) {
                    results.push({ email: user.email, status: 'already exists', id: existingRows[0].id });
                } else {
                    const hashedPassword = await bcrypt.hash(user.password, 10);
                    const result = await db.query(
                        `INSERT INTO users (name, email, password, role, phone, is_active, created_at) 
                         VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP) 
                         RETURNING id`,
                        [user.name, user.email, hashedPassword, user.role, user.phone]
                    );
                    const newId = (result.rows || result)[0]?.id;
                    results.push({ email: user.email, status: 'created', id: newId, password: user.password });
                }
            }
            
            const allUsers = await db.query("SELECT id, name, email, role FROM users ORDER BY id");
            res.json({ message: 'Users fixed', results, allUsers: allUsers.rows || allUsers, requestId: req.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// =============================================
// معالجة الأخطاء العامة
// =============================================
app.use((err, req, res, next) => {
    console.error(`❌ Server Error [${req.id}]:`, err.stack);
    res.status(500).json({ 
        message: 'حدث خطأ في الخادم',
        requestId: req.id,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =============================================
// معالجة المسارات غير الموجودة
// =============================================
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'المسار غير موجود',
        path: req.originalUrl,
        requestId: req.id
    });
});

// =============================================
// بدء الخادم
// =============================================
const startServer = async () => {
    try {
        await initDatabase();
        
        app.listen(PORT, () => {
            console.log(`
    ════════════════════════════════════════════════════════
    🚀 Shamsi.tn Backend Server Started
    ════════════════════════════════════════════════════════
    📡 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📊 Status: Running
    💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}
    🔧 Environment: ${process.env.NODE_ENV || 'development'}
    ⚡ Compression: Enabled
    🛡️  Helmet: Enabled
    🔒 Rate Limiting: 200 requests / 15 minutes
    📝 Request ID: Enabled
    ════════════════════════════════════════════════════════
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();