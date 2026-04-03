const rateLimit = require('express-rate-limit');

// =============================================
// Rate limiting لمنع الـ spam
// =============================================

// لـ API العامة (مثل إنشاء lead)
const createLeadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعة
    max: 5, // 5 محاولات فقط في الساعة
    message: {
        message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
        retryAfter: '60 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // استخدام IP + phone (إذا موجود)
        return req.body?.phone || req.ip;
    }
});

// لـ API الحساسة (تسجيل الدخول)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // 5 محاولات فقط
    message: {
        message: 'محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد 15 دقيقة.'
    }
});

// لـ API الداخلية (للمديرين)
const adminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ساعة
    max: 100, // 100 طلب في الساعة
    message: {
        message: 'لقد تجاوزت الحد المسموح. يرجى المحاولة لاحقاً.'
    }
});

module.exports = {
    createLeadLimiter,
    loginLimiter,
    adminLimiter
};