const db = require('../config/database');

const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// جلب إشعارات المستخدم (محسن)
// =============================================
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;
        
        console.log(`🔔 Fetching notifications for user ${userId}, limit: ${limit}`);
        
        // ✅ استعلام محسن مع LIMIT
        const result = await db.query(`
            SELECT id, lead_id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, parseInt(limit), parseInt(offset)]);
        
        const notifications = getRows(result);
        
        // ✅ حساب الإشعارات غير المقروءة فقط
        const unreadResult = await db.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND is_read = false
        `, [userId]);
        
        const unreadCount = parseInt(unreadResult.rows[0]?.count || 0);
        
        // ✅ إجمالي الإشعارات
        const totalResult = await db.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1
        `, [userId]);
        
        const total = parseInt(totalResult.rows[0]?.count || 0);
        
        console.log(`✅ Found ${notifications.length} notifications, unread: ${unreadCount}, total: ${total}`);
        
        res.json({
            notifications: notifications,
            unreadCount: unreadCount,
            total: total,
            hasMore: total > (parseInt(offset) + notifications.length)
        });
        
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في جلب الإشعارات',
            error: error.message 
        });
    }
};

// =============================================
// تحديث حالة إشعار (قراءة)
// =============================================
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const result = await db.query(`
            UPDATE notifications 
            SET is_read = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [notificationId, userId]);
        
        if (getRows(result).length === 0) {
            return res.status(404).json({ message: 'الإشعار غير موجود' });
        }
        
        res.json({ message: 'تم تحديث حالة الإشعار' });
        
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
};

// =============================================
// تحديث جميع الإشعارات كمقروءة
// =============================================
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await db.query(`
            UPDATE notifications 
            SET is_read = true, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND is_read = false
        `, [userId]);
        
        res.json({ message: 'تم تحديث جميع الإشعارات كمقروءة' });
        
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
};

// =============================================
// حذف إشعار
// =============================================
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const result = await db.query(`
            DELETE FROM notifications
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [notificationId, userId]);
        
        if (getRows(result).length === 0) {
            return res.status(404).json({ message: 'الإشعار غير موجود' });
        }
        
        res.json({ message: 'تم حذف الإشعار' });
        
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
};

// =============================================
// حذف جميع الإشعارات
// =============================================
exports.deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await db.query(`
            DELETE FROM notifications
            WHERE user_id = $1
        `, [userId]);
        
        res.json({ message: 'تم حذف جميع الإشعارات' });
        
    } catch (error) {
        console.error('❌ Error deleting all notifications:', error);
        res.status(500).json({ message: 'حدث خطأ' });
    }
};

// =============================================
// إنشاء إشعار جديد (تستخدم من adminController)
// =============================================
exports.createNotification = async (userId, leadId, title, message, type = 'info') => {
    try {
        const result = await db.query(`
            INSERT INTO notifications (user_id, lead_id, title, message, type, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
            RETURNING id
        `, [userId, leadId, title, message, type]);
        
        return { success: true, id: result.rows[0]?.id };
        
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
    }
};

// =============================================
// إرسال إشعار لمجموعة من المستخدمين
// =============================================
exports.sendBulkNotifications = async (userIds, leadId, title, message, type = 'info') => {
    try {
        const promises = userIds.map(userId => 
            exports.createNotification(userId, leadId, title, message, type)
        );
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        
        console.log(`✅ Sent notifications to ${successCount}/${userIds.length} users`);
        return { success: true, sent: successCount };
        
    } catch (error) {
        console.error('❌ Error sending bulk notifications:', error);
        return { success: false, error: error.message };
    }
};