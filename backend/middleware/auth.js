const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// تسجيل الدخول
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        console.log('📝 Login attempt:', { email, role });
        
        let user = null;
        let userRole = null;
        
        if (role === 'admin') {
            const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
            const rows = result.rows || result;
            if (rows && rows.length > 0) {
                user = rows[0];
                userRole = 'admin';
            }
        } else if (role === 'manager') {
            const result = await db.query('SELECT * FROM managers WHERE email = $1', [email]);
            const rows = result.rows || result;
            if (rows && rows.length > 0) {
                user = rows[0];
                // جلب الدور من قاعدة البيانات (executive, operations)
                userRole = user.role || 'executive';
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
            { id: user.id, email: user.email, role: userRole },
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

// مصادقة عامة
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

// مصادقة للمديرين فقط
exports.isManager = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: Skipping manager check');
        return next();
    }
    if (req.user.role !== 'executive' && req.user.role !== 'operations') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير' });
    }
    next();
};

// مصادقة للمدير التنفيذي فقط
exports.isExecutiveManager = (req, res, next) => {
    if (req.user.role !== 'executive') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير تنفيذي' });
    }
    next();
};

// مصادقة لمدير العمليات فقط
exports.isOperationsManager = (req, res, next) => {
    if (req.user.role !== 'operations') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات مدير عمليات' });
    }
    next();
};

// مصادقة للأدمن فقط
exports.isAdmin = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: Skipping admin check');
        return next();
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح به - مطلوب صلاحيات أدمن' });
    }
    next();
};