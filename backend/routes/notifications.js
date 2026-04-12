const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../utils/notifications');

const router = express.Router();

// جميع المسارات تحتاج مصادقة
router.use(authenticate);

// جلب إشعارات المستخدم
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;
        const result = await getUserNotifications(userId, parseInt(limit), parseInt(offset));
        res.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإشعارات' });
    }
});

// تحديث إشعار كمقروء
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await markNotificationAsRead(id, userId);
        res.json({ message: 'تم تحديث الإشعار' });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
});

// تحديث جميع الإشعارات كمقروءة
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user.id;
        await markAllNotificationsAsRead(userId);
        res.json({ message: 'تم تحديث جميع الإشعارات' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
});

module.exports = router;