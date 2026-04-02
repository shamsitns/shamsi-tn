const express = require('express');
const { login, getCurrentUser } = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// تسجيل الدخول
router.post('/login', login);

// الحصول على معلومات المستخدم الحالي (يتطلب توكن)
router.get('/me', authenticate, getCurrentUser);

module.exports = router;