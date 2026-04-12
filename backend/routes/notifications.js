const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database').getDb;
const {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../utils/notifications');

const router = express.Router();

// Helper function
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

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

// ✅ حفظ اشتراك Push للمستخدم
router.post('/subscribe', async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = req.body;
        
        const dbConnection = db();
        
        await dbConnection.query(
            `INSERT INTO push_subscriptions (user_id, subscription, created_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE SET subscription = $2, updated_at = CURRENT_TIMESTAMP`,
            [userId, JSON.stringify(subscription)]
        );
        
        console.log(`✅ Push subscription saved for user ${userId}`);
        res.json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ message: 'Error saving subscription' });
    }
});

// ✅ إلغاء الاشتراك
router.post('/unsubscribe', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const dbConnection = db();
        
        await dbConnection.query(
            `DELETE FROM push_subscriptions WHERE user_id = $1`,
            [userId]
        );
        
        console.log(`✅ Push subscription removed for user ${userId}`);
        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ message: 'Error unsubscribing' });
    }
});

module.exports = router;