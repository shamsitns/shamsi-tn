const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
    getAllLeads,
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
// جميع المسارات تحتاج مصادقة وصلاحيات مدير عام أو مالك
// =============================================
router.use(authenticate);
router.use(authorize(['general_manager', 'owner']));

// =============================================
// مسارات الطلبات والإحصائيات
// =============================================
router.get('/leads', getAllLeads);
router.get('/stats', getDashboardStats);
router.post('/leads/:leadId/approve', approveLead);
router.post('/leads/:leadId/reject', rejectLead);
router.post('/leads/:leadId/assign-executive', assignToExecutive);
router.post('/leads/:leadId/assign-callcenter', assignToCallCenter);
router.post('/leads/:leadId/assign-bank', assignToBankManager);
router.post('/leads/:leadId/assign-leasing', assignToLeasingManager);

// =============================================
// مسارات حذف الطلبات
// =============================================
router.delete('/leads/:leadId', deleteLead);

// =============================================
// مسارات إدارة المستخدمين
// =============================================
router.get('/users', getAllUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// =============================================
// مسارات إدارة الشركات
// =============================================
router.get('/companies', getAllCompanies);
router.post('/companies', addCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// =============================================
// مسارات العمولات والزكاة (للمالك)
// =============================================
router.get('/commissions/stats', getCommissionStats);

module.exports = router;