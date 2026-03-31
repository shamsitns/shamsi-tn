const express = require('express');
const { authenticate, isAdmin, isGeneralManager, isOwner } = require('../middleware/auth');
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
    deleteLead,
    deleteAllLeads,
    deleteRejectedLeads,
    getAllCompanies,
    addCompany,
    updateCompany,
    deleteCompany
} = require('../controllers/adminController');

const router = express.Router();

// =============================================
// جميع المسارات تحتاج مصادقة وصلاحيات مدير عام أو مالك
// =============================================
router.use(authenticate);
router.use(isGeneralManager);

// =============================================
// مسارات الطلبات والإحصائيات
// =============================================
router.get('/leads', getAllLeads);
router.get('/stats', getDashboardStats);
router.post('/leads/:leadId/approve', approveLead);
router.post('/leads/:leadId/reject', rejectLead);
router.post('/leads/:leadId/assign-executive', assignToExecutive);
router.post('/leads/:leadId/assign-callcenter', assignToCallCenter);

// =============================================
// مسارات حذف الطلبات
// =============================================
router.delete('/leads/:leadId', deleteLead);
router.delete('/leads/all', deleteAllLeads);
router.delete('/leads/rejected', deleteRejectedLeads);

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

module.exports = router;