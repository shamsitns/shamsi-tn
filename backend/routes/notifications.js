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

// ✅ جميع المسارات تحتاج مصادقة (مع معالجة أفضل للأخطاء)
router.use(async (req, res, next) => {
    try {
        await authenticate(req, res, () => {});
        if (!req.user) {
            return res.status(401).json({ message: 'غير مصرح به - يرجى تسجيل الدخول' });
        }
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'غير مصرح به - يرجى تسجيل الدخول' });
    }
});

// جلب إشعارات المستخدم (محسن)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query; // ✅ زيادة limit إلى 50
        
        console.log(`🔔 Fetching notifications for user ${userId}, limit: ${limit}, offset: ${offset}`);
        
        // ✅ استعلام مباشر مع LIMIT
        const dbConnection = db();
        
        const result = await dbConnection.query(`
            SELECT id, lead_id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, parseInt(limit), parseInt(offset)]);
        
        const notifications = getRows(result);
        
        // ✅ حساب الإشعارات غير المقروءة
        const unreadResult = await dbConnection.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND is_read = false
        `, [userId]);
        
        const unreadCount = parseInt(unreadResult.rows[0]?.count || 0);
        
        // ✅ إجمالي الإشعارات
        const totalResult = await dbConnection.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1
        `, [userId]);
        
        const total = parseInt(totalResult.rows[0]?.count || 0);
        
        console.log(`✅ Found ${notifications.length} notifications, unread: ${unreadCount}, total: ${total}`);
        
        res.json({
            notifications,
            unreadCount,
            total,
            hasMore: total > (parseInt(offset) + notifications.length)
        });
        
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإشعارات', error: error.message });
    }
});

// تحديث إشعار كمقروء
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const dbConnection = db();
        
        const result = await dbConnection.query(`
            UPDATE notifications 
            SET is_read = true 
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [id, userId]);
        
        if (getRows(result).length === 0) {
            return res.status(404).json({ message: 'الإشعار غير موجود' });
        }
        
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
        
        const dbConnection = db();
        
        await dbConnection.query(`
            UPDATE notifications 
            SET is_read = true 
            WHERE user_id = $1 AND is_read = false
        `, [userId]);
        
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