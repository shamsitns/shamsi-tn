const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, isManager, isExecutiveManager, isOperationsManager, isCallCenter } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getManagerStats,
    assignToCompany,
    getLeadDetails,
    getAvailableCompanies,
    sendToOperationsManager,
    acceptLeadAndSendToOperations,
    addLeadNote,
    markAsContacted,
    exportLeads,
    // ✅ دوال جديدة لنظام العمولة
    getCompanyCommissionRate,
    updateLeadCommission
} = require('../controllers/managerController');

const router = express.Router();

// =============================================
// Rate limiting للحماية من الإساءة
// =============================================
const managerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 200, // 200 طلب كحد أقصى
    message: {
        message: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// تطبيق rate limiting على جميع مسارات المديرين
router.use(managerLimiter);

// =============================================
// جميع المسارات تحتاج مصادقة وصلاحيات مدير
// =============================================
router.use(authenticate);
router.use(isManager);

// =============================================
// مسارات عامة للمديرين (GET)
// =============================================
router.get('/leads', getMyLeads);
router.get('/leads/export', exportLeads); // تصدير الطلبات إلى CSV/Excel
router.get('/stats', getManagerStats);
router.get('/companies/available', getAvailableCompanies);

// =============================================
// مسارات عامة للمديرين (مع ID) - REST style
// =============================================
router.get('/leads/:id', getLeadDetails);
router.put('/leads/:id/status', updateLeadStatus);
router.post('/leads/:id/notes', addLeadNote);

// =============================================
// مسارات للمدير التنفيذي فقط
// =============================================
router.post('/leads/:id/send-to-operations', isExecutiveManager, sendToOperationsManager);
router.post('/leads/:id/accept', isExecutiveManager, acceptLeadAndSendToOperations);

// =============================================
// مسارات لمدير العمليات فقط
// =============================================
router.post('/leads/:id/assign-company', isOperationsManager, assignToCompany);
// ✅ مسار إضافي للتوافق مع leadId (تمت الإضافة فقط، لم نحذف أي شيء)
router.post('/leads/:leadId/assign-company', isOperationsManager, assignToCompany);

// =============================================
// مسارات لمركز الاتصال فقط
// =============================================
router.post('/leads/:id/contact', isCallCenter, markAsContacted);

// =============================================
// مسارات البحث والفلترة المتقدمة
// =============================================
router.get('/leads/filter/:status', getMyLeads);
router.get('/leads/city/:city', getMyLeads);
router.get('/leads/search', getMyLeads);

// =============================================
// ✅ NEW: مسارات نظام العمولة
// =============================================
// الحصول على نسبة عمولة شركة معينة (لأي مدير مصرح له)
router.get('/companies/:companyId/commission-rate', getCompanyCommissionRate);

// تحديث عمولة طلب معين (عند إتمام الصفقة من قبل مدير العمليات)
router.put('/leads/:leadId/commission', updateLeadCommission);

module.exports = router;