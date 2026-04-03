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
    getCommissionStats
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
// 📋 مسارات الطلبات (Leads)
// =============================================

// جلب جميع الطلبات مع Pagination
router.get('/leads', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString(),
    query('city').optional().isString(),
    validate
], getAllLeads);

// جلب تفاصيل طلب محدد
router.get('/leads/:id', [
    param('id').isInt().withMessage('معرّف الطلب غير صالح'),
    validate
], getLeadById);

// الموافقة على طلب
router.patch('/leads/:leadId/approve', [
    param('leadId').isInt(),
    validate
], approveLead);

// رفض طلب
router.patch('/leads/:leadId/reject', [
    param('leadId').isInt(),
    body('reason').optional().isString(),
    validate
], rejectLead);

// تعيين طلب لمدير تنفيذي
router.patch('/leads/:leadId/assign-executive', [
    param('leadId').isInt(),
    body('executiveId').optional().isInt(),
    body('notes').optional().isString(),
    validate
], assignToExecutive);

// تعيين طلب لمركز الاتصال
router.patch('/leads/:leadId/assign-callcenter', [
    param('leadId').isInt(),
    body('callCenterId').optional().isInt(),
    validate
], assignToCallCenter);

// تعيين طلب لمدير بنك
router.patch('/leads/:leadId/assign-bank', [
    param('leadId').isInt(),
    body('bankManagerId').optional().isInt(),
    body('bankId').optional().isInt(),
    validate
], assignToBankManager);

// تعيين طلب لمدير تأجير
router.patch('/leads/:leadId/assign-leasing', [
    param('leadId').isInt(),
    body('leasingManagerId').optional().isInt(),
    validate
], assignToLeasingManager);

// حذف طلب
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
    body('role').isIn(['executive_manager', 'call_center', 'bank_manager', 'leasing_manager', 'operations_manager'])
        .withMessage('دور غير صالح'),
    body('phone').optional().isString(),
    validate
], addUser);

router.put('/users/:id', [
    param('id').isInt(),
    body('name').optional().isString(),
    body('phone').optional().isString(),
    body('role').optional().isIn(['executive_manager', 'call_center', 'bank_manager', 'leasing_manager', 'operations_manager']),
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