const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const {
    getPublishedPosts,
    getPostBySlug,
    getAllPosts,
    createPost,
    updatePost,
    deletePost,
    getCategories
} = require('../controllers/blogController');

const router = express.Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'بيانات غير صالحة', 
            errors: errors.array() 
        });
    }
    next();
};

// =============================================
// مسارات عامة (لا تحتاج مصادقة)
// =============================================
router.get('/posts', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('category').optional().isString(),
    validate
], getPublishedPosts);

router.get('/posts/:slug', [
    param('slug').isString(),
    validate
], getPostBySlug);

router.get('/categories', getCategories);

// =============================================
// مسارات الإدارة (تتطلب مصادقة وصلاحيات مدير عام)
// =============================================
router.use(authenticate);
router.use(authorize(['general_manager', 'owner']));

router.get('/admin/posts', getAllPosts);

router.post('/admin/posts', [
    body('title').notEmpty().withMessage('العنوان مطلوب'),
    body('slug').notEmpty().withMessage('الرابط مطلوب'),
    body('content').notEmpty().withMessage('المحتوى مطلوب'),
    body('status').isIn(['draft', 'published', 'archived']).withMessage('حالة غير صالحة'),
    validate
], createPost);

router.put('/admin/posts/:id', [
    param('id').isInt(),
    body('title').optional().notEmpty(),
    body('status').optional().isIn(['draft', 'published', 'archived']),
    validate
], updatePost);

router.delete('/admin/posts/:id', [
    param('id').isInt(),
    validate
], deletePost);

module.exports = router;