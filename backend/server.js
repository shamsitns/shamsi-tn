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
    origin: ['http://localhost:3000', 'https://shamsi-tn-frontend.onrender.com'],
    credentials: true
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
// Seed Database - إضافة البيانات الافتراضية عند التشغيل
// =============================================
async function seedDatabase() {
    try {
        console.log('🌱 Checking database seed...');
        
        // إنشاء حساب الأدمن إذا لم يكن موجود
        const adminEmail = 'shamsi.tns@gmail.com';
        const adminPassword = 'Levis1992*&';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        const [existingAdmin] = await db.query('SELECT * FROM admins WHERE email = ?', [adminEmail]);
        if (!existingAdmin || existingAdmin.length === 0) {
            await db.execute(
                'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
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
        
        const [existingManager] = await db.query('SELECT * FROM managers WHERE email = ?', [managerEmail]);
        if (!existingManager || existingManager.length === 0) {
            await db.execute(
                'INSERT INTO managers (name, email, password, phone, company_name, city) VALUES (?, ?, ?, ?, ?, ?)',
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
            const [existing] = await db.query('SELECT * FROM companies WHERE email = ?', [company[1]]);
            if (!existing || existing.length === 0) {
                await db.execute(
                    'INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    company
                );
                console.log(`✅ Company added: ${company[0]}`);
            }
        }
        
        // إضافة الأعمدة المفقودة إذا لزم الأمر
        const columnsToAdd = [
            { name: 'company_id', type: 'INTEGER' },
            { name: 'panel_recommendation', type: 'TEXT' },
            { name: 'panel_brand', type: 'TEXT' }
        ];
        
        for (const col of columnsToAdd) {
            try {
                await db.execute(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added column: ${col.name}`);
            } catch (err) {
                // العمود موجود بالفعل، نتجاهل الخطأ
                if (!err.message.includes('duplicate column')) {
                    console.log(`⚠️ Could not add ${col.name}: ${err.message}`);
                }
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