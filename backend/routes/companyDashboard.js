const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getMyStats,
    getLeadDetails
} = require('../controllers/companyDashboardController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة
router.use(authenticate);

// مسارات الشركة
router.get('/leads', getMyLeads);
router.get('/stats', getMyStats);
router.get('/leads/:leadId', getLeadDetails);
router.patch('/leads/:leadId/status', updateLeadStatus);

module.exports = router;