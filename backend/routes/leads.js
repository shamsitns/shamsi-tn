const express = require('express');
const { body } = require('express-validator');
const { createLead, getLead } = require('../controllers/leadController');

const router = express.Router();

// التحقق من صحة البيانات
const validateLead = [
    body('user_name').notEmpty().withMessage('الاسم مطلوب'),
    body('phone').notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('city').notEmpty().withMessage('المدينة مطلوبة'),
    body('monthly_bill').isFloat({ min: 0 }).withMessage('الفاتورة يجب أن تكون رقماً موجباً'),
    body('roof_area').optional().isFloat({ min: 0 }).withMessage('مساحة السطح يجب أن تكون رقماً موجباً')
];

// إنشاء طلب جديد
router.post('/', validateLead, createLead);

// الحصول على طلب محدد
router.get('/:id', getLead);

module.exports = router;