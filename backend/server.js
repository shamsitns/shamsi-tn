const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { login } = require('./middleware/auth');
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// التأكد من وجود مجلد data (لـ SQLite على Render)
// =============================================
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory on Render');
}

// =============================================
// Middleware (مع تحسينات الأداء)
// =============================================

// ضغط الاستجابات
app.use(compression());

// CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://shamsi-tn-frontend.onrender.com',
        'https://shamsi-tns.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cache-Control للاستجابات
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

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// Routes
// =============================================
app.use('/api/leads', require('./routes/leads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manager', require('./routes/manager'));
app.post('/api/login', login);

// مسار الصحة
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
// مسارات مؤقتة للتحقق من البيانات وإصلاحها
// =============================================

// عرض جميع الطلبات مع العمولة
app.get('/api/check-leads', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, phone, city, recommended_system, commission, status, created_at FROM leads ORDER BY id DESC');
        const leads = result.rows || result;
        
        res.json({
            count: leads.length,
            leads: leads
        });
    } catch (error) {
        console.error('Error checking leads:', error);
        res.status(500).json({ error: error.message });
    }
});

// عرض عدد السجلات في جداول قاعدة البيانات
app.get('/api/db-stats', async (req, res) => {
    try {
        const admins = await db.query('SELECT COUNT(*) as count FROM admins');
        const managers = await db.query('SELECT COUNT(*) as count FROM managers');
        const users = await db.query('SELECT COUNT(*) as count FROM users');
        const companies = await db.query('SELECT COUNT(*) as count FROM companies');
        const leads = await db.query('SELECT COUNT(*) as count FROM leads');
        
        res.json({
            admins: admins.rows[0]?.count || 0,
            managers: managers.rows[0]?.count || 0,
            users: users.rows[0]?.count || 0,
            companies: companies.rows[0]?.count || 0,
            leads: leads.rows[0]?.count || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث جميع الطلبات (إصلاح العمولات)
app.get('/api/fix-all-commissions', async (req, res) => {
    try {
        const result = await db.query('UPDATE leads SET commission = recommended_system * 150 RETURNING id, recommended_system, commission');
        const updated = result.rows || result;
        
        res.json({ 
            message: `✅ تم تحديث ${updated.length} طلب`,
            updated: updated
        });
    } catch (error) {
        console.error('Error fixing all commissions:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسارات مؤقتة لإضافة المستخدمين
// =============================================

// إضافة مستخدم جديد
app.post('/api/add-user', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'الاسم، البريد الإلكتروني وكلمة المرور مطلوبة' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await db.query(`
            INSERT INTO users (name, email, password, role, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (email) DO NOTHING
        `, [name, email, hashedPassword, role || 'executive_manager', phone || null]);
        
        res.json({ message: 'User added successfully' });
        
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسارات مؤقتة لإدارة المديرين
// =============================================

// إضافة مدير تنفيذي
app.get('/api/add-executive-manager', async (req, res) => {
    try {
        const hashedPassword = bcrypt.hashSync('manager123', 10);
        
        await db.query(`
            INSERT INTO users (name, email, password, role, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (email) DO NOTHING
        `, ['محمد إبراهيم الحصايري', 'manager@shamsi.tn', hashedPassword, 'executive_manager', '29593641']);
        
        const result = await db.query('SELECT id, name, email, role FROM users ORDER BY role');
        
        res.json({
            message: 'Executive manager added successfully',
            users: result.rows
        });
        
    } catch (error) {
        console.error('Error adding executive manager:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة مدير عمليات
app.get('/api/add-operations-manager', async (req, res) => {
    try {
        const hashedPassword = bcrypt.hashSync('operations123', 10);
        
        await db.query(`
            INSERT INTO users (name, email, password, role, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (email) DO NOTHING
        `, ['أحمد شبوح', 'operations@shamsi.tn', hashedPassword, 'operations_manager', '50575558']);
        
        const result = await db.query('SELECT id, name, email, role FROM users ORDER BY role');
        
        res.json({
            message: 'Operations manager added successfully',
            users: result.rows
        });
        
    } catch (error) {
        console.error('Error adding operations manager:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة مركز اتصال
app.get('/api/add-callcenter', async (req, res) => {
    try {
        const hashedPassword = bcrypt.hashSync('call123', 10);
        
        await db.query(`
            INSERT INTO users (name, email, password, role, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (email) DO NOTHING
        `, ['مركز الاتصال', 'callcenter@shamsi.tn', hashedPassword, 'call_center', '24661499']);
        
        const result = await db.query('SELECT id, name, email, role FROM users ORDER BY role');
        
        res.json({
            message: 'Call center added successfully',
            users: result.rows
        });
        
    } catch (error) {
        console.error('Error adding call center:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة مدير عام
app.get('/api/add-general-manager', async (req, res) => {
    try {
        const hashedPassword = bcrypt.hashSync('gm123', 10);
        
        await db.query(`
            INSERT INTO users (name, email, password, role, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (email) DO NOTHING
        `, ['مدير عام', 'gm@shamsi.tn', hashedPassword, 'general_manager', '24661499']);
        
        const result = await db.query('SELECT id, name, email, role FROM users ORDER BY role');
        
        res.json({
            message: 'General manager added successfully',
            users: result.rows
        });
        
    } catch (error) {
        console.error('Error adding general manager:', error);
        res.status(500).json({ error: error.message });
    }
});

// تحديث أرقام الهواتف
app.get('/api/update-phones', async (req, res) => {
    try {
        await db.query(`UPDATE users SET phone = $1 WHERE email = $2`, ['29593641', 'manager@shamsi.tn']);
        await db.query(`UPDATE users SET phone = $1 WHERE email = $2`, ['50575558', 'operations@shamsi.tn']);
        await db.query(`UPDATE users SET phone = $1 WHERE email = $2`, ['24661499', 'callcenter@shamsi.tn']);
        await db.query(`UPDATE users SET phone = $1 WHERE email = $2`, ['24661499', 'gm@shamsi.tn']);
        
        const result = await db.query('SELECT id, name, email, phone, role FROM users ORDER BY role');
        
        res.json({
            message: 'Phone numbers updated successfully',
            users: result.rows
        });
        
    } catch (error) {
        console.error('Error updating phones:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// Seed Database
// =============================================
async function seedDatabase() {
    try {
        console.log('🌱 Checking database seed...');
        
        // المالك (Owner)
        const ownerEmail = 'shamsi.tns@gmail.com';
        const ownerPassword = 'Levis1992*&';
        const hashedOwnerPassword = bcrypt.hashSync(ownerPassword, 10);
        
        const existingOwner = await db.query('SELECT * FROM users WHERE email = $1', [ownerEmail]);
        if (!existingOwner || existingOwner.rows.length === 0) {
            await db.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['مالك المنصة', ownerEmail, hashedOwnerPassword, 'owner', '24661499']
            );
            console.log('✅ Owner account created');
        }
        
        // المدير العام
        const gmEmail = 'gm@shamsi.tn';
        const gmPassword = 'gm123';
        const hashedGmPassword = bcrypt.hashSync(gmPassword, 10);
        
        const existingGm = await db.query('SELECT * FROM users WHERE email = $1', [gmEmail]);
        if (!existingGm || existingGm.rows.length === 0) {
            await db.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['مدير عام', gmEmail, hashedGmPassword, 'general_manager', '24661499']
            );
            console.log('✅ General Manager account created');
        }
        
        // المدير التنفيذي
        const execEmail = 'manager@shamsi.tn';
        const execPassword = 'manager123';
        const hashedExecPassword = bcrypt.hashSync(execPassword, 10);
        
        const existingExec = await db.query('SELECT * FROM users WHERE email = $1', [execEmail]);
        if (!existingExec || existingExec.rows.length === 0) {
            await db.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['محمد إبراهيم الحصايري', execEmail, hashedExecPassword, 'executive_manager', '29593641']
            );
            console.log('✅ Executive Manager account created');
        }
        
        // مدير العمليات
        const opsEmail = 'operations@shamsi.tn';
        const opsPassword = 'operations123';
        const hashedOpsPassword = bcrypt.hashSync(opsPassword, 10);
        
        const existingOps = await db.query('SELECT * FROM users WHERE email = $1', [opsEmail]);
        if (!existingOps || existingOps.rows.length === 0) {
            await db.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['أحمد شبوح', opsEmail, hashedOpsPassword, 'operations_manager', '50575558']
            );
            console.log('✅ Operations Manager account created');
        }
        
        // مركز الاتصال
        const callEmail = 'callcenter@shamsi.tn';
        const callPassword = 'call123';
        const hashedCallPassword = bcrypt.hashSync(callPassword, 10);
        
        const existingCall = await db.query('SELECT * FROM users WHERE email = $1', [callEmail]);
        if (!existingCall || existingCall.rows.length === 0) {
            await db.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['مركز الاتصال', callEmail, hashedCallPassword, 'call_center', '24661499']
            );
            console.log('✅ Call Center account created');
        }
        
        // الأدمن القديم للتوافق
        const adminEmail = 'admin@shamsi.tn';
        const adminPassword = 'admin123';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        const existingAdmin = await db.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (!existingAdmin || existingAdmin.rows.length === 0) {
            await db.query(
                'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
                ['Admin Shamsi', adminEmail, hashedAdminPassword]
            );
            console.log('✅ Admin account created');
        }
        
        // الشركات التجريبية
        const companies = [
            ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية', 4.8, 120],
            ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة', 4.7, 95],
            ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان', 4.9, 150]
        ];
        
        for (const company of companies) {
            const existing = await db.query('SELECT * FROM companies WHERE email = $1', [company[1]]);
            if (!existing || existing.rows.length === 0) {
                await db.query(
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
        console.error('❌ Error seeding database:', error.message);
    }
}

// =============================================
// بدء الخادم
// =============================================
app.listen(PORT, async () => {
    console.log(`
    ════════════════════════════════════════════
    🚀 Shamsi.tn Backend Server Started
    ════════════════════════════════════════════
    📡 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}/api
    📊 Status: Running
    💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}
    ⚡ Compression: Enabled
    ════════════════════════════════════════════
    `);
    
    setTimeout(() => {
        seedDatabase();
    }, 2000);
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