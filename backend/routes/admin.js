const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const {
    getAllLeads,
    approveLead,
    rejectLead,
    sendToManager,
    getAllManagers,
    getLeadStats
} = require('../controllers/adminController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة وصلاحيات أدمن
router.use(authenticate);
router.use(isAdmin);

// مسارات API
router.get('/leads', getAllLeads);
router.get('/managers', getAllManagers);
router.get('/stats', getLeadStats);
router.post('/leads/:leadId/approve', approveLead);
router.post('/leads/:leadId/reject', rejectLead);
router.post('/leads/:leadId/send-to-manager', sendToManager);

module.exports = router;