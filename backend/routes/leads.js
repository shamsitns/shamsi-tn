const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    createLead,
    getLead,
    calculateLead,
    updateLeadStatus,
    getMyLeads,
    addLeadNote
} = require('../controllers/leadController');

const router = express.Router();

// =============================================
// المسارات العامة (بدون مصادقة)
// =============================================

// حساب النظام الشمسي (بدون حفظ)
router.post('/calculate', calculateLead);

// ✅ إنشاء طلب جديد (عام – لا يحتاج تسجيل دخول)
router.post('/', createLead);

// =============================================
// المسارات المحمية (تتطلب مصادقة)
// =============================================

// جلب طلبات المستخدم الحالي (للمديرين)
router.get('/my-leads', authenticate, getMyLeads);

// جلب تفاصيل طلب محدد
router.get('/:id', authenticate, getLead);

// تحديث حالة طلب (للمديرين)
router.put('/:id/status', authenticate, updateLeadStatus);

// إضافة ملاحظات للطلب
router.post('/:id/notes', authenticate, addLeadNote);

module.exports = router;