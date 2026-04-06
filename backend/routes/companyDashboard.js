const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getMyStats,
    getLeadDetails,
    updateCommission,
    getCommissionRate,
    updateCommissionRate
} = require('../controllers/companyDashboardController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة
router.use(authenticate);

// مسارات الشركة
router.get('/leads', getMyLeads);
router.get('/stats', getMyStats);
router.get('/leads/:leadId', getLeadDetails);
router.patch('/leads/:leadId/status', updateLeadStatus);
router.patch('/leads/:leadId/commission', updateCommission);

// ✅ NEW: Commission rate management
router.get('/commission-rate', getCommissionRate);
router.put('/commission-rate', updateCommissionRate);

module.exports = router;