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
const companyDashboardRoutes = require('./routes/companyDashboard');
const notificationRoutes = require('./routes/notifications');
const companyRequestsRoutes = require('./routes/companyRequests');

// =============================================
// التأكد من وجود مجلد data (لـ SQLite على Render)
// =============================================
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// =============================================
// Trust proxy (لـ Render)
// =============================================
app.set('trust proxy', 1);

// =============================================
// Request ID Middleware (للتتبع والتصحيح)
// =============================================
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// =============================================
// Rate Limiting - معطل مؤقتاً للتجربة
// =============================================
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 200,
//     message: { message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' },
//     standardHeaders: true,
//     legacyHeaders: false
// });
// app.use(`${API_PREFIX}/`, limiter);

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
    ? ['https://shamsi.tn', 'https://www.shamsi.tn', 'https://shamsi-tns.onrender.com', 'https://shamsi-tn.onrender.com']
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
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
app.use(`${API_PREFIX}/company`, companyDashboardRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/company-requests`, companyRequestsRoutes);

// =============================================
// ✅ Create New Lead (POST /api/leads)
// =============================================
app.post(`${API_PREFIX}/leads`, async (req, res) => {
    try {
        console.log('📝 Creating new lead via server.js');
        console.log('📦 Request body keys:', Object.keys(req.body));
        
        const {
            name, phone, city, property_type, bill_amount,
            bill_period_months, bill_season, roof_availability,
            roof_area, meter_number, payment_method, preferred_bank,
            panel_type, additional_info, roof_type, installation_timeline,
            required_kw, panels_count, annual_production, annual_savings,
            monthly_savings, co2_saved, solar_score, coverage_percent,
            invoiceImage
        } = req.body;
        
        const userId = req.user?.id || null;
        
        if (!name || !phone || !bill_amount) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، وقيمة الفاتورة مطلوبة']
            });
        }
        
        // حساب العمولة (افتراضي 150 دينار لكل كيلوواط)
        const commissionAmount = (required_kw || 0) * 150;
        
        // حساب lead score بسيط
        let leadScore = 0;
        if (bill_amount > 500) leadScore += 30;
        else if (bill_amount > 300) leadScore += 20;
        else if (bill_amount > 150) leadScore += 10;
        
        // رفع الصورة إذا وجدت
        let invoiceImageUrl = null;
        let invoiceImageFileId = null;

        if (invoiceImage) {
            invoiceImageUrl = 'https://picsum.photos/400/300?random=' + Date.now();
            console.log(`✅ Mock invoice image URL: ${invoiceImageUrl}`);
        }
        
        const db = getDb();
        
        const query = `
            INSERT INTO leads (
                name, phone, city, property_type, bill_amount,
                bill_period_months, bill_season, roof_availability, roof_area,
                meter_number, payment_method, preferred_bank, panel_type,
                additional_info, roof_type, installation_timeline,
                required_kw, panels_count, annual_production, annual_savings,
                monthly_savings, co2_saved, solar_score, coverage_percent,
                commission_amount, lead_score, invoice_image_url, invoice_image_file_id,
                status, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        
        const values = [
            name, 
            phone, 
            city || null, 
            property_type || 'house', 
            parseFloat(bill_amount),
            parseInt(bill_period_months) || 60, 
            bill_season || 'spring',
            roof_availability !== undefined ? roof_availability : true,
            roof_area ? parseFloat(roof_area) : null, 
            meter_number || null,
            payment_method || null, 
            preferred_bank || null, 
            panel_type || null,
            additional_info || null, 
            roof_type || null, 
            installation_timeline || null,
            required_kw || null, 
            panels_count || null, 
            annual_production || null,
            annual_savings || null, 
            monthly_savings || null, 
            co2_saved || null,
            solar_score || null, 
            coverage_percent || null,
            commissionAmount, 
            leadScore,
            invoiceImageUrl, 
            invoiceImageFileId,
            'pending', 
            userId
        ];
        
        const result = await db.query(query, values);
        const leadId = result.rows?.[0]?.id;
        
        console.log(`✅ Lead created successfully with ID: ${leadId}`);
        console.log(`   🖼️ Invoice image: ${invoiceImageUrl ? 'تم الرفع' : 'لا توجد صورة'}`);
        console.log(`   💰 Commission: ${commissionAmount} DT`);
        
        // ✅ إضافة إشعارات مباشرة باستخدام SQL مع تصحيح الأخطاء
        try {
            console.log('🔍 Attempting to insert notifications for lead:', leadId);
            
            const dbInsert = getDb();
            
            // التحقق من وجود المستخدمين
            const userCheck = await dbInsert.query('SELECT id, email FROM users WHERE id IN (19, 26)');
            console.log('👥 Users found:', userCheck.rows);
            
            if (userCheck.rows.length === 0) {
                console.error('❌ Users 19 or 26 not found!');
            }
            
            // إشعار للمدير العام (ID: 19)
            const gmResult = await dbInsert.query(
                `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [19, leadId, '📋 طلب جديد', `طلب جديد من ${name} (${phone}) في انتظار المراجعة`, 'info']
            );
            console.log(`✅ GM notification inserted, ID: ${gmResult.rows[0]?.id}`);
            
            // إشعار للمدير التنفيذي (ID: 26)
            const execResult = await dbInsert.query(
                `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [26, leadId, '📋 طلب جديد', `طلب جديد من ${name} (${phone}) في انتظار المراجعة`, 'info']
            );
            console.log(`✅ Executive notification inserted, ID: ${execResult.rows[0]?.id}`);
            
        } catch (notifError) {
            console.error('❌ Error sending SQL notifications:', notifError);
            console.error('Error details:', notifError.message);
            console.error('Error stack:', notifError.stack);
        }
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: leadId,
            invoiceImageUrl: invoiceImageUrl,
            solarData: {
                required_kw: required_kw,
                panels_count: panels_count,
                commission_amount: commissionAmount
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating lead:', error);
        res.status(500).json({
            message: 'حدث خطأ في إنشاء الطلب',
            error: error.message
        });
    }
});

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
// ✅ TEMPORARY: List all registered routes
// =============================================
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    function extractRoutes(stack, basePath = '') {
        stack.forEach(layer => {
            if (layer.route) {
                const path = basePath + layer.route.path;
                const methods = Object.keys(layer.route.methods);
                routes.push({ path, methods });
            } else if (layer.name === 'router' && layer.handle.stack) {
                const routerPath = layer.regexp.source
                    .replace('\\/?(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\^/g, '')
                    .replace(/\?/g, '')
                    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
                extractRoutes(layer.handle.stack, basePath + routerPath);
            }
        });
    }
    
    extractRoutes(app._router.stack, '');
    
    const apiRoutes = routes.filter(route => route.path.startsWith('/api'));
    
    res.json({
        totalRoutes: apiRoutes.length,
        routes: apiRoutes
    });
});

// =============================================
// ✅ TEMPORARY: Test endpoint
// =============================================
app.post('/api/test-send/:leadId', (req, res) => {
    console.log('🔍 Test endpoint reached');
    console.log('📝 Lead ID:', req.params.leadId);
    console.log('📦 Body:', req.body);
    res.json({ 
        success: true, 
        message: 'Test endpoint works!', 
        leadId: req.params.leadId,
        receivedBody: req.body
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
        
        await db.query('DROP TABLE IF EXISTS manager_assignments CASCADE;');
        console.log('✅ Dropped old manager_assignments table');
        
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
// ✅ FORCE FIX: Reset manager_assignments without foreign keys
// =============================================
app.get(`${API_PREFIX}/force-fix-assignments`, async (req, res) => {
    try {
        const db = getDb();
        
        await db.query('DROP TABLE IF EXISTS manager_assignments CASCADE;');
        console.log('✅ Dropped old manager_assignments');
        
        await db.query(`
            CREATE TABLE manager_assignments (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER NOT NULL,
                manager_id INTEGER NOT NULL,
                assigned_by INTEGER NOT NULL,
                notes TEXT,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created new manager_assignments without foreign keys');
        
        res.json({ 
            message: 'manager_assignments table recreated successfully without foreign keys',
            note: 'Now assignments should work'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// ✅ Add test leads
// =============================================
app.get(`${API_PREFIX}/add-test-leads`, async (req, res) => {
    try {
        const db = getDb();
        
        const gmResult = await db.query("SELECT id FROM users WHERE email = 'gm@shamsi.tn' LIMIT 1");
        const gmId = (gmResult.rows || gmResult)[0]?.id || 2;
        
        const testLeads = [
            { name: 'أحمد بن علي', phone: '12345678', city: 'تونس', property_type: 'house', bill_amount: 250, bill_period_months: 60, bill_season: 'summer', required_kw: 5.0, panels_count: 10, commission_amount: 750, status: 'pending', created_by: gmId },
            { name: 'سارة بن سالم', phone: '87654321', city: 'صفاقس', property_type: 'apartment', bill_amount: 180, bill_period_months: 60, bill_season: 'spring', required_kw: 3.5, panels_count: 7, commission_amount: 525, status: 'approved', created_by: gmId },
            { name: 'محمد الفاهم', phone: '11223344', city: 'سوسة', property_type: 'farm', bill_amount: 450, bill_period_months: 60, bill_season: 'summer', required_kw: 9.0, panels_count: 18, commission_amount: 1350, status: 'contacted', created_by: gmId }
        ];
        
        let added = 0;
        
        for (const lead of testLeads) {
            await db.query(`
                INSERT INTO leads (name, phone, city, property_type, bill_amount, bill_period_months, bill_season, required_kw, panels_count, commission_amount, status, created_by, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
            `, [lead.name, lead.phone, lead.city, lead.property_type, lead.bill_amount, lead.bill_period_months, lead.bill_season, lead.required_kw, lead.panels_count, lead.commission_amount, lead.status, lead.created_by]);
            added++;
        }
        
        res.json({ message: `Added ${added} test leads successfully` });
        
    } catch (error) {
        console.error('Error adding test leads:', error);
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
    🔒 Rate Limiting: Disabled (temporarily)
    📝 Request ID: Enabled
    ✅ Company Requests API: Enabled (/api/company-requests)
    ✅ POST /api/leads: Enabled (for lead creation with images)
    ✅ Notification System: Enabled with direct SQL inserts and debug logging
    ════════════════════════════════════════════════════════
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();