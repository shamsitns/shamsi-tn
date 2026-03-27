const db = require('../config/database');

// الحصول على جميع الطلبات
exports.getAllLeads = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM leads';
        const queryParams = [];
        
        if (status && status !== 'all') {
            query += ' WHERE status = ?';
            queryParams.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [leads] = await db.query(query, queryParams);
        
        // الحصول على العدد الإجمالي
        let countQuery = 'SELECT COUNT(*) as total FROM leads';
        if (status && status !== 'all') {
            countQuery += ' WHERE status = ?';
        }
        const [countResult] = await db.query(
            countQuery,
            (status && status !== 'all') ? [status] : []
        );
        
        res.json({
            leads: leads || [],
            total: countResult[0]?.total || 0,
            page: parseInt(page),
            totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
        });
        
    } catch (error) {
        console.error('Error getting leads:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
    }
};

// الموافقة على طلب
exports.approveLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        
        await db.execute(
            'UPDATE leads SET status = "approved_by_admin", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [leadId]
        );
        
        res.json({ message: 'تمت الموافقة على الطلب بنجاح' });
        
    } catch (error) {
        console.error('Error approving lead:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// رفض طلب
exports.rejectLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason } = req.body;
        
        await db.execute(
            'UPDATE leads SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [leadId]
        );
        
        res.json({ message: 'تم رفض الطلب' });
        
    } catch (error) {
        console.error('Error rejecting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// إرسال طلب لمدير
exports.sendToManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { managerId, notes } = req.body;
        const adminId = req.user?.id || 1;
        
        // التحقق من وجود المدير
        const [managers] = await db.query(
            'SELECT id FROM managers WHERE id = ?',
            [managerId]
        );
        
        if (!managers || managers.length === 0) {
            return res.status(404).json({ message: 'المدير غير موجود' });
        }
        
        // تحديث lead
        await db.execute(
            'UPDATE leads SET status = "sent_to_manager", manager_id = ? WHERE id = ?',
            [managerId, leadId]
        );
        
        // إضافة تعيين
        await db.execute(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes) 
             VALUES (?, ?, ?, ?)`,
            [leadId, managerId, adminId, notes || null]
        );
        
        res.json({ message: 'تم إرسال الطلب للمدير بنجاح' });
        
    } catch (error) {
        console.error('Error sending to manager:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على جميع المديرين
exports.getAllManagers = async (req, res) => {
    try {
        const [managers] = await db.query(
            'SELECT id, name, email, phone, company_name, city FROM managers'
        );
        res.json(managers || []);
        
    } catch (error) {
        console.error('Error getting managers:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};
// الحصول على إحصائيات الطلبات
exports.getLeadStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status = 'approved_by_admin' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'sent_to_manager' THEN 1 ELSE 0 END) as sent_to_manager,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                COALESCE(SUM(required_kw), 0) as total_kw,
                COALESCE(SUM(commission), 0) as total_commission
            FROM leads
        `);
        
        res.json(stats[0] || {
            total: 0, new: 0, approved: 0, sent_to_manager: 0, completed: 0, rejected: 0,
            total_kw: 0, total_commission: 0
        });
        
    } catch (error) {
        console.error('Error getting lead stats:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};