const db = require('../config/database');

// ✅ محاولة تحميل web-push بشكل اختياري (لن يسبب خطأ إذا لم يكن موجوداً)
let webPush = null;
try {
    webPush = require('web-push');
    console.log('✅ web-push loaded successfully');
} catch (error) {
    console.warn('⚠️ web-push not installed. Push notifications disabled.');
}

// Helper functions
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// إعداد VAPID للإشعارات (فقط إذا كانت web-push موجودة والمفاتيح متاحة)
if (webPush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        'mailto:shamsi.tns@gmail.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push configured successfully');
} else if (webPush) {
    console.warn('⚠️ VAPID keys not set. Push notifications disabled.');
}

// =============================================
// دالة إرسال إشعار لمستخدم واحد
// =============================================
async function sendNotification(userId, leadId, title, message, type = 'info') {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, lead_id, title, message, type, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id`,
            [userId, leadId, title, message, type]
        );
        console.log(`✅ Notification sent to user ${userId}: ${title}`);
        
        // ✅ إرسال Push Notification إذا كانت متاحة
        if (webPush) {
            await sendPushNotification(userId, title, message, `/lead/${leadId}`, leadId);
        }
        
        return result.rows[0]?.id;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return null;
    }
}

// =============================================
// دالة إرسال إشعار لعدة مستخدمين
// =============================================
async function sendNotificationToMultipleUsers(userIds, leadId, title, message, type = 'info') {
    const results = [];
    for (const userId of userIds) {
        const result = await sendNotification(userId, leadId, title, message, type);
        results.push(result);
    }
    return results;
}

// =============================================
// دالة إرسال إشعار لجميع المستخدمين من دور معين
// =============================================
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

// =============================================
// دالة إرسال إشعار لجميع الإداريين
// =============================================
async function sendNotificationToAllAdmins(leadId, title, message, type = 'info') {
    const adminRoles = ['general_manager', 'owner', 'executive_manager'];
    const results = [];
    
    for (const role of adminRoles) {
        const roleResults = await sendNotificationToRole(role, leadId, title, message, type);
        results.push(...roleResults);
    }
    return results;
}

// =============================================
// دالة جلب إشعارات المستخدم
// =============================================
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

// =============================================
// دالة تحديث إشعار كمقروء
// =============================================
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

// =============================================
// دالة تحديث جميع الإشعارات كمقروءة
// =============================================
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

// =============================================
// دالة إرسال Push Notification (للموبايل)
// =============================================
async function sendPushNotification(userId, title, body, url = '/', leadId = null) {
    if (!webPush) {
        return false;
    }
    
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return false;
    }
    
    try {
        const result = await db.query(
            'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return false;
        }
        
        const subscription = result.rows[0].subscription;
        
        const payload = JSON.stringify({
            title: title,
            body: body,
            url: url,
            leadId: leadId
        });
        
        await webPush.sendNotification(subscription, payload);
        console.log(`📱 Push notification sent to user ${userId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
        return false;
    }
}

// =============================================
// دالة إرسال Push Notification لعدة مستخدمين
// =============================================
async function sendPushNotificationToMultipleUsers(userIds, title, body, url = '/', leadId = null) {
    const results = [];
    for (const userId of userIds) {
        const result = await sendPushNotification(userId, title, body, url, leadId);
        results.push(result);
    }
    return results;
}

// =============================================
// دالة إرسال Push Notification لدور معين
// =============================================
async function sendPushNotificationToRole(role, title, body, url = '/', leadId = null) {
    try {
        const usersResult = await db.query(
            'SELECT id FROM users WHERE role = $1 AND is_active = true',
            [role]
        );
        const userIds = usersResult.rows.map(row => row.id);
        return await sendPushNotificationToMultipleUsers(userIds, title, body, url, leadId);
    } catch (error) {
        console.error('❌ Error sending push to role:', error);
        return [];
    }
}

// =============================================
// تصدير الدوال
// =============================================
module.exports = {
    sendNotification,
    sendNotificationToMultipleUsers,
    sendNotificationToRole,
    sendNotificationToAllAdmins,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    sendPushNotification,
    sendPushNotificationToMultipleUsers,
    sendPushNotificationToRole
};