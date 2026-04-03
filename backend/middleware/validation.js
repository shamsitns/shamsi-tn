const { body, param, query, validationResult } = require('express-validator');

// =============================================
// التحقق من صحة البيانات
// =============================================

// التحقق من إنشاء lead جديد
const validateCreateLead = [
    body('name')
        .notEmpty().withMessage('الاسم مطلوب')
        .isLength({ min: 3, max: 100 }).withMessage('الاسم يجب أن يكون بين 3 و 100 حرف'),
    
    body('phone')
        .notEmpty().withMessage('رقم الهاتف مطلوب')
        .isMobilePhone('any').withMessage('رقم هاتف غير صالح')
        .isLength({ min: 8, max: 15 }).withMessage('رقم الهاتف يجب أن يكون بين 8 و 15 رقم'),
    
    body('city')
        .optional()
        .isString().withMessage('المدينة يجب أن تكون نصاً'),
    
    body('property_type')
        .isIn(['house', 'apartment', 'farm', 'commercial', 'factory'])
        .withMessage('نوع العقار غير صالح'),
    
    body('bill_amount')
        .isFloat({ min: 10, max: 10000 }).withMessage('قيمة الفاتورة يجب أن تكون بين 10 و 10000 دينار'),
    
    body('bill_period_months')
        .isInt({ min: 30, max: 90 }).withMessage('فترة الفاتورة غير صالحة'),
    
    body('bill_season')
        .isIn(['spring', 'summer', 'autumn', 'winter'])
        .withMessage('الموسم غير صالح'),
    
    body('roof_area')
        .optional()
        .isFloat({ min: 10, max: 1000 }).withMessage('مساحة السطح يجب أن تكون بين 10 و 1000 متر مربع'),
    
    body('meter_number')
        .optional()
        .isString().withMessage('رقم العداد غير صالح'),
    
    body('payment_method')
        .optional()
        .isIn(['cash', 'bank', 'prosol', 'leasing', 'steg'])
        .withMessage('طريقة الدفع غير صالحة')
];

// التحقق من تحديث حالة الطلب
const validateUpdateStatus = [
    param('id').isInt().withMessage('معرّف الطلب غير صالح'),
    body('status')
        .isIn(['pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'completed', 'cancelled'])
        .withMessage('حالة غير صالحة'),
    body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نصاً')
];

// التحقق من pagination
const validatePagination = [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('رقم الصفحة غير صالح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('عدد العناصر غير صالح')
];

// دالة معالجة الأخطاء
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'بيانات غير صالحة',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateCreateLead,
    validateUpdateStatus,
    validatePagination,
    handleValidationErrors
};