const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// =============================================
// تسجيل الدخول
// =============================================
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        console.log('📝 Login attempt:', { email, role });
        
        let user = null;
        let userRole = null;
        let sourceTable = null;
        
        // البحث في جدول users أولاً (الأدوار الجديدة)
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const users = userResult.rows || userResult;
        
        if (users && users.length > 0) {
            user = users[0];
            userRole = user.role;
            sourceTable = 'users';
        }
        
        // إذا لم يوجد في users، نبحث في جدول admins (للتوافق مع القديم)
        if (!user && role === 'admin') {
            const adminResult = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
            const admins = adminResult.rows || adminResult;
            if (admins && admins.length > 0) {
                user = admins[0];
                userRole = 'admin';
                sourceTable = 'admins';
            }
        }
        
        // إذا لم يوجد في users، نبحث في جدول managers (للتوافق مع القديم)
        if (!user && role === 'manager') {
            const managerResult = await db.query('SELECT * FROM managers WHERE email = $1', [email]);
            const managers = managerResult.rows || managerResult;
            if (managers && managers.length > 0) {
                user = managers[0];
                // استخراج الدور من جدول managers (executive أو operations)
                userRole = user.role || 'executive';
                sourceTable = 'managers';
            }
        }
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: userRole, source: sourceTable },
            process.env.JWT_SECRET || 'shamsi_tn_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful:', email, 'Role:', userRole);
        
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: userRole
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
    }
};

// =============================================
// مصادقة عامة
// =============================================
exports.authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'غير مصرح به' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shamsi_tn_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'توكن غير صالح' });
    }
};

// =============================================
// مصادقة للمالك (Owner)
// =============================================
exports.isOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات المالك' });
    }
    next();
};

// =============================================
// مصادقة للمدير العام (General Manager)
// =============================================
exports.isGeneralManager = (req, res, next) => {
    if (req.user.role !== 'general_manager' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير عام' });
    }
    next();
};

// =============================================
// مصادقة للمدير التنفيذي (Executive Manager)
// =============================================
exports.isExecutiveManager = (req, res, next) => {
    if (req.user.role !== 'executive_manager' && req.user.role !== 'owner' && req.user.role !== 'general_manager') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير تنفيذي' });
    }
    next();
};

// =============================================
// مصادقة لمركز الاتصال (Call Center)
// =============================================
exports.isCallCenter = (req, res, next) => {
    if (req.user.role !== 'call_center' && req.user.role !== 'owner' && req.user.role !== 'general_manager') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مركز اتصال' });
    }
    next();
};

// =============================================
// مصادقة لمدير العمليات (Operations Manager)
// =============================================
exports.isOperationsManager = (req, res, next) => {
    if (req.user.role !== 'operations_manager' && req.user.role !== 'owner' && req.user.role !== 'general_manager') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير عمليات' });
    }
    next();
};

// =============================================
// مصادقة للأدمن (للتوافق مع الكود القديم)
// =============================================
exports.isAdmin = (req, res, next) => {
    // قبول الأدوار: owner, general_manager (كمدير عام) والأدمن القديم
    const allowedRoles = ['owner', 'general_manager', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات أدمن' });
    }
    next();
};

// =============================================
// مصادقة للمدير (للتوافق مع الكود القديم)
// =============================================
exports.isManager = (req, res, next) => {
    // قبول الأدوار: executive_manager, operations_manager, owner, general_manager
    const allowedRoles = ['executive_manager', 'operations_manager', 'owner', 'general_manager'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير' });
    }
    next();
};