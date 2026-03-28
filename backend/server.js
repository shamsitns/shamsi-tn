const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { login } = require('./middleware/auth');
const db = require('./config/database');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// Middleware
// =============================================
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
        environment: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// مسار مؤقت لاستيراد البيانات (احذفه بعد الاستيراد)
// =============================================
app.get('/api/import-data', async (req, res) => {
    try {
        console.log('📥 Starting data import...');
        
        const fs = require('fs');
        const path = require('path');
        
        // استيراد المديرين
        const managersPath = path.join(__dirname, 'data-managers.json');
        if (fs.existsSync(managersPath)) {
            const managers = JSON.parse(fs.readFileSync(managersPath, 'utf8'));
            for (const m of managers) {
                await db.query(
                    `INSERT INTO managers (id, name, email, password, phone, company_name, city, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
                    [m.id, m.name, m.email, m.password, m.phone, m.company_name, m.city, m.created_at]
                );
                console.log(`✅ Manager: ${m.name}`);
            }
        }
        
        // استيراد الشركات
        const companiesPath = path.join(__dirname, 'data-companies.json');
        if (fs.existsSync(companiesPath)) {
            const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));
            for (const c of companies) {
                await db.query(
                    `INSERT INTO companies (id, name, email, password, phone, city, description, rating, projects_count, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
                    [c.id, c.name, c.email, c.password, c.phone, c.city, c.description, c.rating, c.projects_count, c.created_at]
                );
                console.log(`✅ Company: ${c.name}`);
            }
        }
        
        // استيراد العملاء
        const leadsPath = path.join(__dirname, 'data-leads.json');
        if (fs.existsSync(leadsPath)) {
            const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
            for (const l of leads) {
                await db.query(
                    `INSERT INTO leads (id, user_name, phone, city, property_type, payment_method, monthly_bill, 
                     roof_area, roof_direction, shading, required_kw, estimated_price, panels, panel_power, 
                     annual_production, annual_savings, payback_years, commission, status, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
                     ON CONFLICT (id) DO NOTHING`,
                    [l.id, l.user_name, l.phone, l.city, l.property_type, l.payment_method, l.monthly_bill,
                     l.roof_area, l.roof_direction, l.shading, l.required_kw, l.estimated_price, l.panels, l.panel_power,
                     l.annual_production, l.annual_savings, l.payback_years, l.commission, l.status, l.created_at]
                );
                console.log(`✅ Lead: ${l.user_name}`);
            }
        }
        
        console.log('✅ Import completed!');
        res.json({ message: 'Import completed successfully' });
        
    } catch (error) {
        console.error('❌ Import error:', error);
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
            await db.execute(
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
            await db.execute(
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
                await db.execute(
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