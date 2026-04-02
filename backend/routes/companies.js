const express = require('express');
const { authenticate, isGeneralManager } = require('../middleware/auth');
const {
    getAllCompanies,
    getCompany,
    addCompany,
    updateCompany,
    deleteCompany,
    getCompanyLeads,
    assignLeadToCompany,
    updateLeadAssignmentStatus,
    getCompaniesStats
} = require('../controllers/companyController');

const router = express.Router();

// =============================================
// المسارات العامة (بدون مصادقة)
// =============================================

// جلب جميع الشركات (للعرض في الصفحة الرئيسية)
router.get('/', getAllCompanies);

// جلب شركة محددة
router.get('/:id', getCompany);

// =============================================
// المسارات المحمية (تتطلب مصادقة وصلاحيات مدير عام)
// =============================================

// جلب إحصائيات الشركات
router.get('/stats/all', authenticate, isGeneralManager, getCompaniesStats);

// جلب طلبات شركة محددة
router.get('/:id/leads', authenticate, isGeneralManager, getCompanyLeads);

// إضافة شركة جديدة
router.post('/', authenticate, isGeneralManager, addCompany);

// تحديث شركة
router.put('/:id', authenticate, isGeneralManager, updateCompany);

// حذف شركة
router.delete('/:id', authenticate, isGeneralManager, deleteCompany);

// تعيين طلب لشركة
router.post('/leads/:leadId/assign/:companyId', authenticate, isGeneralManager, assignLeadToCompany);

// تحديث حالة تعيين طلب لشركة
router.put('/leads/:leadId/assign/:companyId/status', authenticate, isGeneralManager, updateLeadAssignmentStatus);

module.exports = router;