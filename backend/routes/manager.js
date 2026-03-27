const express = require('express');
const { authenticate, isManager } = require('../middleware/auth');
const {
    getMyLeads,
    updateLeadStatus,
    getManagerStats
} = require('../controllers/managerController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة وصلاحيات مدير
router.use(authenticate);
router.use(isManager);

router.get('/leads', getMyLeads);
router.get('/stats', getManagerStats);
router.put('/leads/:leadId/status', updateLeadStatus);

module.exports = router;