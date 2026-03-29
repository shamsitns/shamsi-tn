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
// مسار مؤقت لإضافة Operations Manager
// =============================================
app.get('/api/add-operations-manager', async (req, res) => {
    try {
        try {
            await db.query(`ALTER TABLE managers ADD COLUMN role VARCHAR(50) DEFAULT 'executive'`);
            console.log('✅ Added role column to managers table');
        } catch (err) {
            if (!err.message.includes('duplicate column') && !err.message.includes('already exists')) {
                console.log('ℹ️ Role column already exists');
            }
        }
        
        const hashedPassword = bcrypt.hashSync('operations123', 10);
        
        await db.query(`
            INSERT INTO managers (name, email, password, phone, company_name, city, role) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO NOTHING
        `, ['أحمد شبوح', 'operations@shamsi.tn', hashedPassword, '24661499', 'Shamsi.tn', 'تونس', 'operations']);
        
        await db.query(`
            UPDATE managers SET role = 'executive' WHERE email = 'manager@shamsi.tn'
        `);
        
        const result = await db.query('SELECT id, name, email, role FROM managers');
        
        res.json({
            message: 'Operations Manager added successfully',
            managers: result.rows
        });
        
    } catch (error) {
        console.error('Error adding operations manager:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسار مؤقت لتحديث أدوار المديرين
// =============================================
app.get('/api/update-manager-roles', async (req, res) => {
    try {
        await db.query(
            `UPDATE managers SET role = 'executive' WHERE email = $1`,
            ['manager@shamsi.tn']
        );
        
        await db.query(
            `UPDATE managers SET role = 'operations' WHERE email = $1`,
            ['operations@shamsi.tn']
        );
        
        const result = await db.query('SELECT id, name, email, role FROM managers');
        
        res.json({
            message: 'Manager roles updated successfully',
            managers: result.rows
        });
        
    } catch (error) {
        console.error('Error updating manager roles:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسار مؤقت لتنظيف وتحديث المديرين
// =============================================
app.get('/api/clean-managers', async (req, res) => {
    try {
        await db.query(`
            DELETE FROM managers 
            WHERE email NOT IN ('manager@shamsi.tn', 'operations@shamsi.tn')
        `);
        
        await db.query(`
            UPDATE managers 
            SET name = 'محمد إبراهيم الحصايري', 
                role = 'executive',
                phone = '24661499',
                company_name = 'Shamsi.tn',
                city = 'تونس'
            WHERE email = 'manager@shamsi.tn'
        `);
        
        const hashedPassword = bcrypt.hashSync('operations123', 10);
        
        await db.query(`
            INSERT INTO managers (name, email, password, phone, company_name, city, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (email) DO UPDATE SET
                name = EXCLUDED.name,
                password = EXCLUDED.password,
                phone = EXCLUDED.phone,
                company_name = EXCLUDED.company_name,
                city = EXCLUDED.city,
                role = EXCLUDED.role
        `, ['أحمد شبوح', 'operations@shamsi.tn', hashedPassword, '24661499', 'Shamsi.tn', 'تونس', 'operations']);
        
        const result = await db.query('SELECT id, name, email, role FROM managers ORDER BY role');
        
        res.json({
            message: 'Managers cleaned and updated successfully',
            managers: result.rows
        });
        
    } catch (error) {
        console.error('Error cleaning managers:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسار مؤقت لإصلاح العمولات الناقصة
// =============================================
app.get('/api/fix-commissions', async (req, res) => {
    try {
        console.log("🛠️ Executing commission fix...");
        
        const result = await db.query(`
            UPDATE leads 
            SET commission = required_kw * 150 
            WHERE commission IS NULL OR commission = 0
            RETURNING id, required_kw, commission
        `);
        
        const updatedLeads = result.rows || result;
        
        console.log(`✅ Updated ${updatedLeads.length} leads with commission`);
        
        res.json({
            message: `✅ تم تحديث ${updatedLeads.length} طلب/طلبات بنجاح.`,
            updatedLeads: updatedLeads
        });
        
    } catch (error) {
        console.error("❌ Error fixing commissions:", error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// مسارات مؤقتة للتحقق من البيانات وإصلاحها
// =============================================

// عرض جميع الطلبات مع العمولة
app.get('/api/check-leads', async (req, res) => {
    try {
        const result = await db.query('SELECT id, user_name, required_kw, commission, status, created_at FROM leads ORDER BY id DESC');
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

// تحديث عمولة طلب محدد
app.get('/api/fix-lead-commission/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('SELECT required_kw, commission FROM leads WHERE id = $1', [id]);
        const leads = result.rows || result;
        
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const lead = leads[0];
        const newCommission = lead.required_kw * 150;
        
        await db.query('UPDATE leads SET commission = $1 WHERE id = $2', [newCommission, id]);
        
        res.json({ 
            message: `✅ تم تحديث الطلب ${id}`,
            old_commission: lead.commission,
            new_commission: newCommission,
            required_kw: lead.required_kw
        });
    } catch (error) {
        console.error('Error fixing commission:', error);
        res.status(500).json({ error: error.message });
    }
});

// تحديث جميع الطلبات
app.get('/api/fix-all-commissions', async (req, res) => {
    try {
        const result = await db.query('UPDATE leads SET commission = required_kw * 150 RETURNING id, required_kw, commission');
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
// Seed Database
// =============================================
async function seedDatabase() {
    try {
        console.log('🌱 Checking database seed...');
        
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
        
        const managerEmail = 'manager@shamsi.tn';
        const managerPassword = 'manager123';
        const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);
        
        const existingManager = await db.query('SELECT * FROM managers WHERE email = $1', [managerEmail]);
        if (!existingManager || existingManager.rows.length === 0) {
            await db.query(
                'INSERT INTO managers (name, email, password, phone, company_name, city, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                ['محمد إبراهيم الحصايري', managerEmail, hashedManagerPassword, '24661499', 'Shamsi.tn', 'تونس', 'executive']
            );
            console.log('✅ Executive Manager account created');
        }
        
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