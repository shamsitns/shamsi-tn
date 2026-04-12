const db = require('../config/database');

// دالة إرسال إشعار لمستخدم واحد
async function sendNotification(userId, leadId, title, message, type = 'info') {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id`,
            [userId, leadId, title, message, type]
        );
        console.log(`✅ Notification sent to user ${userId}: ${title}`);
        return result.rows[0]?.id;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return null;
    }
}

// دالة إرسال إشعار لعدة مستخدمين
async function sendNotificationToMultipleUsers(userIds, leadId, title, message, type = 'info') {
    const results = [];
    for (const userId of userIds) {
        const result = await sendNotification(userId, leadId, title, message, type);
        results.push(result);
    }
    return results;
}

// دالة إرسال إشعار لجميع المستخدمين من دور معين
async function sendNotificationToRole(role, leadId, title, message, type = 'info') {
    try {
        const usersResult = await db.query(
            'SELECT id FROM users WHERE role = $1 AND is_active = true',
            [role]
        );
        const userIds = usersResult.rows.map(row => row.id);
        return await sendNotificationToMultipleUsers(userIds, leadId, title, message, type);
    } catch (error) {
        console.error('❌ Error sending to role:', error);
        return [];
    }
}

// دالة إرسال إشعار لجميع المستخدمين (إداريين فقط)
async function sendNotificationToAllAdmins(leadId, title, message, type = 'info') {
    const adminRoles = ['general_manager', 'owner', 'executive_manager'];
    const results = [];
    
    for (const role of adminRoles) {
        const roleResults = await sendNotificationToRole(role, leadId, title, message, type);
        results.push(...roleResults);
    }
    return results;
}

// دالة جلب إشعارات المستخدم
async function getUserNotifications(userId, limit = 20, offset = 0) {
    try {
        const result = await db.query(
            `SELECT n.*, l.name as lead_name
             FROM notifications n
             LEFT JOIN leads l ON n.lead_id = l.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        
        const unreadCount = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );
        
        return {
            notifications: result.rows,
            unreadCount: parseInt(unreadCount.rows[0]?.count || 0),
            total: result.rows.length
        };
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        return { notifications: [], unreadCount: 0, total: 0 };
    }
}

// دالة تحديث حالة الإشعار (قراءة)
async function markNotificationAsRead(notificationId, userId) {
    try {
        await db.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
        return true;
    } catch (error) {
        console.error('❌ Error marking as read:', error);
        return false;
    }
}

// دالة تحديث جميع الإشعارات كمقروءة
async function markAllNotificationsAsRead(userId) {
    try {
        await db.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [userId]
        );
        return true;
    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        return false;
    }
}

module.exports = {
    sendNotification,
    sendNotificationToMultipleUsers,
    sendNotificationToRole,
    sendNotificationToAllAdmins,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};