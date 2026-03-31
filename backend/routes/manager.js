const express = require('express');
const { authenticate, isManager, isExecutiveManager, isOperationsManager } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getManagerStats,
    assignToCompany,
    getLeadDetails,
    getAvailableCompanies,
    sendToOperationsManager,
    acceptLeadAndSendToOperations
} = require('../controllers/managerController');

const router = express.Router();

// =============================================
// جميع المسارات تحتاج مصادقة وصلاحيات مدير
// =============================================
router.use(authenticate);
router.use(isManager);

// =============================================
// مسارات عامة للمديرين
// =============================================
router.get('/leads', getMyLeads);
router.get('/stats', getManagerStats);
router.put('/leads/:leadId/status', updateLeadStatus);
router.get('/leads/:leadId/details', getLeadDetails);
router.get('/companies/available', getAvailableCompanies);

// =============================================
// مسارات للمدير التنفيذي فقط
// =============================================
router.post('/leads/:leadId/send-to-operations', isExecutiveManager, sendToOperationsManager);
router.post('/leads/:leadId/accept', isExecutiveManager, acceptLeadAndSendToOperations);

// =============================================
// مسارات لمدير العمليات فقط
// =============================================
router.post('/leads/:leadId/assign-company', isOperationsManager, assignToCompany);

module.exports = router;