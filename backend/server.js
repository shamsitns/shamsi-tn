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
const blogRoutes = require('./routes/blog');

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
// Rate Limiting - حماية من الهجمات
// =============================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 200, // 200 طلب كحد أقصى لكل IP
    message: { message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === `${API_PREFIX}/health` // تخطي الـ health check
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

// Body parsing
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
app.use('/api/blog', blogRoutes);

// =============================================
// Create New Lead (POST /api/leads)
// =============================================
app.post(`${API_PREFIX}/leads`, async (req, res) => {
    try {
        console.log('📝 Creating new lead');
        
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
        
        // حساب العمولة
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
            const { uploadImage, FOLDERS, validateImage } = require('./utils/imagekit');
            const validation = validateImage(invoiceImage, 5);
            if (validation.valid) {
                const uploadResult = await uploadImage(
                    invoiceImage,
                    `invoice_${Date.now()}_${userId || 'guest'}.jpg`,
                    FOLDERS.INVOICES
                );
                if (uploadResult.success) {
                    invoiceImageUrl = uploadResult.url;
                    invoiceImageFileId = uploadResult.fileId;
                    console.log(`✅ Invoice image uploaded: ${invoiceImageUrl}`);
                }
            }
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
            name, phone, city || null, property_type || 'house',
            parseFloat(bill_amount), parseInt(bill_period_months) || 60, bill_season || 'spring',
            roof_availability !== undefined ? roof_availability : true,
            roof_area ? parseFloat(roof_area) : null, meter_number || null,
            payment_method || null, preferred_bank || null, panel_type || null,
            additional_info || null, roof_type || null, installation_timeline || null,
            required_kw || null, panels_count || null, annual_production || null,
            annual_savings || null, monthly_savings || null, co2_saved || null,
            solar_score || null, coverage_percent || null,
            commissionAmount, leadScore, invoiceImageUrl, invoiceImageFileId,
            'pending', userId
        ];
        
        const result = await db.query(query, values);
        const leadId = result.rows?.[0]?.id;
        
        console.log(`✅ Lead created successfully with ID: ${leadId}`);
        
        // إضافة إشعارات
        try {
            const dbInsert = getDb();
            
            await dbInsert.query(
                `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [19, leadId, '📋 طلب جديد', `طلب جديد من ${name} (${phone}) في انتظار المراجعة`, 'info']
            );
            
            await dbInsert.query(
                `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [26, leadId, '📋 طلب جديد', `طلب جديد من ${name} (${phone}) في انتظار المراجعة`, 'info']
            );
            
            console.log(`✅ Notifications sent for lead ${leadId}`);
        } catch (notifError) {
            console.error('❌ Error sending notifications:', notifError);
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
// خدمة الملفات الثابتة لـ React (في الإنتاج)
// =============================================
const buildPath = path.join(__dirname, 'frontend', 'build');

// التحقق من وجود مجلد build
if (process.env.NODE_ENV === 'production' && fs.existsSync(buildPath)) {
    console.log(`📁 Serving React build from: ${buildPath}`);
    
    // خدمة الملفات الثابتة
    app.use(express.static(buildPath));
    
    // ✅ إعادة توجيه جميع المسارات غير المعروفة إلى index.html
    // هذا مهم جداً لـ React Router
    app.get('*', (req, res) => {
        // استثناء مسارات API
        if (req.path.startsWith(API_PREFIX)) {
            return res.status(404).json({ 
                message: 'API endpoint not found',
                path: req.originalUrl,
                requestId: req.id
            });
        }
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    console.log('📁 Development mode or build folder not found - API only mode');
    // معالجة المسارات غير الموجودة (للتطوير)
    app.use('*', (req, res) => {
        res.status(404).json({ 
            message: 'المسار غير موجود',
            path: req.originalUrl,
            requestId: req.id
        });
    });
}

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
    🔒 Rate Limiting: Enabled
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