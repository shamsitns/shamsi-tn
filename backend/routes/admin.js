const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const {
    getAllLeads,
    getLeadById,
    getDashboardStats,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    approveLead,
    rejectLead,
    assignToExecutive,
    assignToCallCenter,
    assignToBankManager,
    assignToLeasingManager,
    deleteLead,
    getAllCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    getCommissionStats,
    // ✅ NEW: الدوال الجديدة
    getLeadFollow,
    updateLeadSections,
    getAllLeadsWithSections
} = require('../controllers/adminController');

const router = express.Router();

// =============================================
// Middleware للتحقق من صحة البيانات
// =============================================
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'بيانات غير صالحة', 
            errors: errors.array() 
        });
    }
    next();
};

// =============================================
// جميع المسارات تحتاج مصادقة وصلاحيات مدير عام أو مالك
// =============================================
router.use(authenticate);
router.use(authorize(['general_manager', 'owner']));

// =============================================
// 📊 مسارات الإحصائيات
// =============================================
router.get('/stats', getDashboardStats);
router.get('/commissions/stats', getCommissionStats);

// =============================================
// 📋 مسارات الطلبات (Leads) - GET
// =============================================
router.get('/leads', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('city').optional().isString(),
    validate
], getAllLeads);

// ✅ NEW: مسار واحد لجلب كل الطلبات مع الأقسام (يحل مشكلة الاتصالات المتعددة)
router.get('/leads-with-sections', [
    query('status').optional().isString(),
    validate
], getAllLeadsWithSections);

router.get('/leads/:id', [
    param('id').isInt().withMessage('معرّف الطلب غير صالح'),
    validate
], getLeadById);

// ✅ NEW: مسار جلب تتبع الطلب
router.get('/leads/:leadId/follow', [
    param('leadId').isInt().withMessage('معرّف الطلب غير صالح'),
    validate
], getLeadFollow);

// ✅ NEW: مسار تحديث الأقسام المرسل إليها
router.patch('/leads/:leadId/update-sections', [
    param('leadId').isInt().withMessage('معرّف الطلب غير صالح'),
    body('assigned_sections').isArray().withMessage('يجب أن يكون مصفوفة من الأقسام'),
    validate
], updateLeadSections);

// =============================================
// 📋 مسارات الطلبات (Leads) - POST
// =============================================
router.post('/leads/:leadId/approve', [
    param('leadId').isInt(),
    validate
], approveLead);

router.post('/leads/:leadId/reject', [
    param('leadId').isInt(),
    body('reason').optional().isString(),
    validate
], rejectLead);

router.post('/leads/:leadId/assign-executive', [
    param('leadId').isInt(),
    body('executiveId').optional().isInt(),
    body('notes').optional().isString(),
    validate
], assignToExecutive);

router.post('/leads/:leadId/assign-callcenter', [
    param('leadId').isInt(),
    body('callCenterId').optional().isInt(),
    validate
], assignToCallCenter);

router.post('/leads/:leadId/assign-bank', [
    param('leadId').isInt(),
    body('bankManagerId').optional().isInt(),
    body('bankId').optional({ nullable: true }).isInt(),
    validate
], assignToBankManager);

router.post('/leads/:leadId/assign-leasing', [
    param('leadId').isInt(),
    body('leasingManagerId').optional().isInt(),
    validate
], assignToLeasingManager);

// =============================================
// 🗑️ مسارات حذف الطلبات
// =============================================
router.delete('/leads/:leadId', [
    param('leadId').isInt(),
    validate
], deleteLead);

// =============================================
// 👥 مسارات إدارة المستخدمين
// =============================================
router.get('/users', [
    query('role').optional().isString(),
    validate
], getAllUsers);

router.post('/users', [
    body('name').notEmpty().withMessage('الاسم مطلوب'),
    body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('role').isIn(['executive_manager', 'call_center', 'bank_manager', 'leasing_manager', 'operations_manager', 'company'])
        .withMessage('دور غير صالح'),
    body('phone').optional().isString(),
    validate
], addUser);

router.put('/users/:id', [
    param('id').isInt(),
    body('name').optional().isString(),
    body('phone').optional().isString(),
    body('role').optional().isIn(['executive_manager', 'call_center', 'bank_manager', 'leasing_manager', 'operations_manager', 'company']),
    body('is_active').optional().isBoolean(),
    validate
], updateUser);

router.delete('/users/:id', [
    param('id').isInt(),
    validate
], deleteUser);

// =============================================
// 🏢 مسارات إدارة الشركات
// =============================================
router.get('/companies', getAllCompanies);

router.post('/companies', [
    body('name').notEmpty().withMessage('اسم الشركة مطلوب'),
    body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
    body('phone').optional().isString(),
    body('address').optional().isString(),
    body('contact_person').optional().isString(),
    body('projects_count').optional().isInt({ min: 0 }),
    validate
], addCompany);

router.put('/companies/:id', [
    param('id').isInt(),
    body('name').optional().isString(),
    body('phone').optional().isString(),
    body('address').optional().isString(),
    body('contact_person').optional().isString(),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('projects_count').optional().isInt({ min: 0 }),
    body('is_active').optional().isBoolean(),
    validate
], updateCompany);

router.delete('/companies/:id', [
    param('id').isInt(),
    validate
], deleteCompany);

module.exports = router;