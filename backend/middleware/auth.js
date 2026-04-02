const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// تسجيل الدخول
// =============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('📝 Login attempt:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
        }
        
        // البحث في جدول users (جميع الأدوار)
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = getFirstRow(result);
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        // التحقق من صحة كلمة المرور
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        // التحقق من أن المستخدم نشط
        if (!user.is_active) {
            console.log('❌ Inactive user:', email);
            return res.status(401).json({ message: 'الحساب غير نشط. يرجى التواصل مع المدير' });
        }
        
        // إنشاء التوكن
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: user.name,
                role: user.role,
                phone: user.phone
            },
            process.env.JWT_SECRET || 'shamsi_tn_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful:', email, 'Role:', user.role);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
    }
};

// =============================================
// مصادقة عامة (التحقق من التوكن)
// =============================================
exports.authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'غير مصرح به - يرجى تسجيل الدخول' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shamsi_tn_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'انتهت صلاحية التوكن، يرجى تسجيل الدخول مرة أخرى' });
        }
        return res.status(401).json({ message: 'توكن غير صالح' });
    }
};

// =============================================
// مصادقة للمالك (Owner)
// =============================================
exports.isOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ 
            message: 'غير مصرح به - هذه الصفحة مخصصة للمالك فقط',
            requiredRole: 'owner',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة للمدير العام (General Manager)
// =============================================
exports.isGeneralManager = (req, res, next) => {
    const allowedRoles = ['general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير عام',
            requiredRole: 'general_manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة للمدير التنفيذي (Executive Manager)
// =============================================
exports.isExecutiveManager = (req, res, next) => {
    const allowedRoles = ['executive_manager', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير تنفيذي',
            requiredRole: 'executive_manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة لمركز الاتصال (Call Center)
// =============================================
exports.isCallCenter = (req, res, next) => {
    const allowedRoles = ['call_center', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مركز اتصال',
            requiredRole: 'call_center',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة لمدير العمليات (Operations Manager)
// =============================================
exports.isOperationsManager = (req, res, next) => {
    const allowedRoles = ['operations_manager', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير عمليات',
            requiredRole: 'operations_manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة لمدير البنك (Bank Manager)
// =============================================
exports.isBankManager = (req, res, next) => {
    const allowedRoles = ['bank_manager', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير بنك',
            requiredRole: 'bank_manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة لمدير التأجير التمويلي (Leasing Manager)
// =============================================
exports.isLeasingManager = (req, res, next) => {
    const allowedRoles = ['leasing_manager', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير تأجير',
            requiredRole: 'leasing_manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// مصادقة للمدير (للتوافق مع الكود القديم)
// =============================================
exports.isManager = (req, res, next) => {
    const allowedRoles = ['executive_manager', 'operations_manager', 'call_center', 'bank_manager', 'leasing_manager', 'general_manager', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'غير مصرح به - مطلوب صلاحيات مدير',
            requiredRole: 'manager',
            yourRole: req.user.role
        });
    }
    next();
};

// =============================================
// الحصول على معلومات المستخدم الحالي
// =============================================
exports.getCurrentUser = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        const user = getFirstRow(result);
        
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        res.json(user);
        
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب معلومات المستخدم', error: error.message });
    }
};