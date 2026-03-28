const express = require('express');
const { authenticate, isManager } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getManagerStats,
    assignToCompany,
    getLeadDetails,
    getAvailableCompanies
} = require('../controllers/managerController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة وصلاحيات مدير
router.use(authenticate);
router.use(isManager);

// مسارات الطلبات
router.get('/leads', getMyLeads);
router.get('/stats', getManagerStats);
router.put('/leads/:leadId/status', updateLeadStatus);
router.post('/leads/:leadId/assign-company', assignToCompany);
router.get('/leads/:leadId/details', getLeadDetails);

// مسارات الشركات
router.get('/companies/available', getAvailableCompanies);

module.exports = router;