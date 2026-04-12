const express = require('express');
const { authenticate, isBankManager } = require('../middleware/auth');
const {
    getMyFinancingRequests,
    updateFinancingStatus,
    getBankStats,
    getFinancingRequestDetails,
    getAvailableBanks
} = require('../controllers/bankController');

const router = express.Router();

// ✅ إضافة مسار اختبار بسيط (يمكنك إزالته لاحقاً)
router.get('/test', (req, res) => {
    console.log('🔍 Bank test endpoint hit!');
    res.json({ message: 'Bank routes are working!' });
});

// جميع المسارات تحتاج مصادقة وصلاحيات مدير بنك
router.use(authenticate);
router.use(isBankManager);

// الحصول على طلبات التمويل الخاصة بالبنك
router.get('/requests', getMyFinancingRequests);

// الحصول على إحصائيات البنك
router.get('/stats', getBankStats);

// الحصول على تفاصيل طلب تمويل محدد
router.get('/requests/:requestId', getFinancingRequestDetails);

// تحديث حالة طلب تمويلd
router.put('/requests/:requestId/status', updateFinancingStatus);

// الحصول على قائمة البنوك المتاحة
router.get('/banks/available', getAvailableBanks);

module.exports = router;