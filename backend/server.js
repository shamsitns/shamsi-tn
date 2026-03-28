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
    // عدم تطبيق cache على مسارات API
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
// مسارات مؤقتة لتنظيف البيانات وإعادة تعيين التسلسل
// =============================================

// حذف جميع البيانات وإعادة تعيين التسلسل
app.get('/api/clean-duplicates', async (req, res) => {
    try {
        await db.query('DELETE FROM leads');
        await db.query('SELECT setval(\'leads_id_seq\', 1, false)');
        console.log('✅ Cleaned leads table and reset sequence');
        res.json({ message: 'Cleanup completed. All leads deleted, sequence reset to 1' });
    } catch (error) {
        console.error('❌ Error cleaning duplicates:', error);
        res.status(500).json({ error: error.message });
    }
});

// عرض عدد السجلات في جداول قاعدة البيانات
app.get('/api/db-stats', async (req, res) => {
    try {
        const admins = await db.query('SELECT COUNT(*) as count FROM admins');
        const managers = await db.query('SELECT COUNT(*) as count FROM managers');
        const companies = await db.query('SELECT COUNT(*) as count FROM companies');
        const leads = await db.query('SELECT COUNT(*) as count FROM leads');
        
        res.json({
            admins: admins.rows[0]?.count || 0,
            managers: managers.rows[0]?.count || 0,
            companies: companies.rows[0]?.count || 0,
            leads: leads.rows[0]?.count || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة بيانات تجريبية
app.get('/api/add-sample-lead', async (req, res) => {
    try {
        const solarData = {
            requiredKw: 5,
            estimatedPrice: 16000,
            panels: 10,
            panelPower: 0.5,
            inverterPower: 5.5,
            annualProduction: 7500,
            annualSavings: 1650,
            paybackYears: 9.7,
            commission: 500
        };
        
        await db.query(`
            INSERT INTO leads (
                user_name, phone, city, property_type, payment_method,
                monthly_bill, monthly_consumption, meter_owner,
                roof_area, roof_direction, shading,
                required_kw, estimated_price, panels, panel_power,
                inverter_power, annual_production, annual_savings, 
                payback_years, commission, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        `, [
            'أحمد بن علي', '12345678', 'تونس', 'house', 'cash',
            250, null, 1,
            80, 'جنوب', 'لا يوجد',
            solarData.requiredKw, solarData.estimatedPrice, solarData.panels, solarData.panelPower,
            solarData.inverterPower, solarData.annualProduction, solarData.annualSavings,
            solarData.paybackYears, solarData.commission, 'new'
        ]);
        
        res.json({ message: 'Sample lead added successfully' });
    } catch (error) {
        console.error('Error adding sample lead:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// Seed Database - إضافة البيانات الافتراضية عند التشغيل
// =============================================
async function seedDatabase() {
    try {
        console.log('🌱 Checking database seed...');
        
        // إنشاء حساب الأدمن إذا لم يكن موجود
        const adminEmail = 'shamsi.tns@gmail.com';
        const adminPassword = 'Levis1992*&';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        const existingAdmin = await db.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (!existingAdmin || existingAdmin.rows.length === 0) {
            await db.query(
                'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
                ['Shamsi TN', adminEmail, hashedAdminPassword]
            );
            console.log('✅ Admin account created');
        } else {
            console.log('ℹ️ Admin account already exists');
        }
        
        // إنشاء مدير تجريبي إذا لم يكن موجود
        const managerEmail = 'manager@shamsi.tn';
        const managerPassword = 'manager123';
        const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);
        
        const existingManager = await db.query('SELECT * FROM managers WHERE email = $1', [managerEmail]);
        if (!existingManager || existingManager.rows.length === 0) {
            await db.query(
                'INSERT INTO managers (name, email, password, phone, company_name, city) VALUES ($1, $2, $3, $4, $5, $6)',
                ['مدير تجريبي', managerEmail, hashedManagerPassword, '12345678', 'شركة الطاقة الشمسية', 'تونس']
            );
            console.log('✅ Manager account created');
        } else {
            console.log('ℹ️ Manager account already exists');
        }
        
        // إنشاء شركات تجريبية إذا لم تكن موجودة
        const companies = [
            ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية للمنازل والشركات', 4.8, 120],
            ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة في الجنوب التونسي', 4.7, 95],
            ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان في السوق التونسية', 4.9, 150]
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
        
        console.log('✅ Database seeding completed');
        
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
    
    // تشغيل seed بعد 2 ثانية من بدء الخادم
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