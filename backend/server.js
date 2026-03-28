const express = require('express');
const cors = require('cors');
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
        environment: process.env.NODE_ENV || 'development',
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
    });
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
        
        // إنشاء طلب تجريبي
        const leadsExists = await db.query('SELECT * FROM leads LIMIT 1');
        if (!leadsExists || leadsExists.rows.length === 0) {
            await db.execute(`
                INSERT INTO leads (
                    user_name, phone, city, property_type, payment_method,
                    monthly_bill, roof_area, roof_direction, shading,
                    required_kw, estimated_price, panels, panel_power,
                    annual_production, annual_savings, payback_years, commission, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            `, [
                'أحمد بن علي', '12345678', 'تونس', 'house', 'cash',
                250, 80, 'جنوب', 'لا يوجد',
                5, 16000, 10, 0.5,
                7500, 1650, 9.7, 500, 'new'
            ]);
            console.log('✅ Test lead created');
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