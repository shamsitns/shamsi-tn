const express = require('express');
const { authenticate, isLeasingManager } = require('../middleware/auth');
const {
    getMyLeasingRequests,
    updateLeasingStatus,
    getLeasingStats,
    getLeasingRequestDetails,
    getAvailableLeasingCompanies
} = require('../controllers/leasingController');

const router = express.Router();

// جميع المسارات تحتاج مصادقة وصلاحيات مدير تأجير
router.use(authenticate);
router.use(isLeasingManager);

// الحصول على طلبات التأجير الخاصة
router.get('/requests', getMyLeasingRequests);

// الحصول على إحصائيات شركة التأجير
router.get('/stats', getLeasingStats);

// الحصول على تفاصيل طلب تأجير محدد
router.get('/requests/:requestId', getLeasingRequestDetails);

// تحديث حالة طلب تأجير
router.put('/requests/:requestId/status', updateLeasingStatus);

// الحصول على قائمة شركات التأجير المتاحة
router.get('/companies/available', getAvailableLeasingCompanies);

module.exports = router;