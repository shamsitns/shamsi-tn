const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getMyStats,
    getLeadDetails,
    updateCommission  // ✅ إضافة الدالة الجديدة
} = require('../controllers/companyDashboardController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة
router.use(authenticate);

// مسارات الشركة
router.get('/leads', getMyLeads);
router.get('/stats', getMyStats);
router.get('/leads/:leadId', getLeadDetails);
router.patch('/leads/:leadId/status', updateLeadStatus);
router.patch('/leads/:leadId/commission', updateCommission);  // ✅ مسار تحديث العمولة

module.exports = router;