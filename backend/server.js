const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // ✅ أضف هذا السطر

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
// Middleware (مع تحسينات الأداء)
// =============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://shamsi-tn-frontend.onrender.com',
        'https://shamsi-tns.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache Control
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
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
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/leasing', leasingRoutes);

// =============================================
// Health Check
// =============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Shamsi.tn API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
    });
});

// =============================================
// مسار مؤقت للتحقق من الطلبات
// =============================================
app.get('/api/check-leads', async (req, res) => {
    try {
        const db = getDb();
        const result = await db.query('SELECT id, name, phone, city, required_kw, commission_amount, status, created_at FROM leads ORDER BY id DESC');
        const leads = result.rows || result;
        
        res.json({
            count: leads.length,
            leads: leads
        });
    } catch (error) {
        console.error('❌ Error checking leads:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسار مؤقت لإحصائيات قاعدة البيانات
// =============================================
app.get('/api/db-stats', async (req, res) => {
    try {
        const db = getDb();
        const users = await db.query('SELECT COUNT(*) as count FROM users');
        const companies = await db.query('SELECT COUNT(*) as count FROM companies');
        const leads = await db.query('SELECT COUNT(*) as count FROM leads');
        const assignments = await db.query('SELECT COUNT(*) as count FROM manager_assignments');
        const leadCompanies = await db.query('SELECT COUNT(*) as count FROM lead_companies');
        
        const usersCount = (users.rows || users)[0]?.count || 0;
        const companiesCount = (companies.rows || companies)[0]?.count || 0;
        const leadsCount = (leads.rows || leads)[0]?.count || 0;
        const assignmentsCount = (assignments.rows || assignments)[0]?.count || 0;
        const leadCompaniesCount = (leadCompanies.rows || leadCompanies)[0]?.count || 0;
        
        res.json({
            users: usersCount,
            companies: companiesCount,
            leads: leadsCount,
            manager_assignments: assignmentsCount,
            lead_companies: leadCompaniesCount
        });
    } catch (error) {
        console.error('❌ Error getting db stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ✅ TEMPORARY: مسار لتشغيل seed.js وإصلاح قاعدة البيانات
// =============================================
app.get('/api/run-seed', async (req, res) => {
    try {
        console.log('🌱 Running seed to fix database...');
        
        // تشغيل seed.js
        exec('node backend/seed.js', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Seed error:', error);
                return res.status(500).json({ 
                    message: 'Seed failed', 
                    error: error.message,
                    stderr: stderr 
                });
            }
            console.log('✅ Seed completed successfully');
            res.json({ 
                message: 'Seed completed successfully', 
                output: stdout,
                note: 'Users and companies have been added to the database'
            });
        });
    } catch (error) {
        console.error('❌ Error running seed:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// معالجة الأخطاء العامة
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ 
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =============================================
// معالجة المسارات غير الموجودة
// =============================================
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'المسار غير موجود',
        path: req.originalUrl
    });
});

// =============================================
// بدء الخادم
// =============================================
const startServer = async () => {
    try {
        // Initialize database
        await initDatabase();
        
        app.listen(PORT, () => {
            console.log(`
    ════════════════════════════════════════════
    🚀 Shamsi.tn Backend Server Started
    ════════════════════════════════════════════
    📡 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📊 Status: Running
    💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}
    ⚡ Compression: Enabled
    🛡️  Helmet: Enabled
    ════════════════════════════════════════════
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

startServer();