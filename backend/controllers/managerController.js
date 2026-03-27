const db = require('../config/database');

// الحصول على طلبات المدير
exports.getMyLeads = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT l.*, ma.assigned_at, ma.notes, ma.status as assignment_status
            FROM leads l
            JOIN manager_assignments ma ON l.id = ma.lead_id
            WHERE ma.manager_id = ?
        `;
        const queryParams = [managerId];
        
        if (status && status !== 'all') {
            query += ' AND l.status = ?';
            queryParams.push(status);
        }
        
        query += ' ORDER BY ma.assigned_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [leads] = await db.query(query, queryParams);
        
        res.json(leads || []);
        
    } catch (error) {
        console.error('Error getting manager leads:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// تحديث حالة طلب
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status, notes } = req.body;
        const managerId = req.user.id;
        
        // التحقق من أن الطلب للمدير
        const [assignments] = await db.query(
            'SELECT id FROM manager_assignments WHERE lead_id = ? AND manager_id = ?',
            [leadId, managerId]
        );
        
        if (!assignments || assignments.length === 0) {
            return res.status(403).json({ message: 'غير مصرح لك بتحديث هذا الطلب' });
        }
        
        // تحديث lead
        await db.execute(
            'UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, leadId]
        );
        
        // تحديث التعيين
        await db.execute(
            'UPDATE manager_assignments SET status = ?, notes = ? WHERE lead_id = ? AND manager_id = ?',
            [status, notes || null, leadId, managerId]
        );
        
        res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
        
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على إحصائيات المدير
exports.getManagerStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        
        const [stats] = await db.query(`
            SELECT 
                COUNT(CASE WHEN l.status = 'sent_to_manager' THEN 1 END) as pending,
                COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN l.status = 'rejected' THEN 1 END) as rejected,
                COALESCE(SUM(CASE WHEN l.status = 'completed' THEN l.commission ELSE 0 END), 0) as total_commission
            FROM leads l
            JOIN manager_assignments ma ON l.id = ma.lead_id
            WHERE ma.manager_id = ?
        `, [managerId]);
        
        res.json(stats[0] || { pending: 0, completed: 0, rejected: 0, total_commission: 0 });
        
    } catch (error) {
        console.error('Error getting manager stats:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};