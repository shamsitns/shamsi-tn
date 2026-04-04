const db = require('../config/database');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// الحصول على طلبات المدير التنفيذي
// =============================================
exports.getMyLeads = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.role;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Manager ${managerId} (${role}) fetching leads, status: ${status}`);
        
        // ✅ إزالة assigned_to - نستخدم created_by للمدير التنفيذي
        let query = `
            SELECT l.*
            FROM leads l
            WHERE l.created_by = $1
        `;
        const queryParams = [managerId];
        let paramIndex = 2;
        
        if (status && status !== 'all') {
            query += ` AND l.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = getRows(result);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM leads WHERE created_by = $1`;
        const countParams = [managerId];
        let countIndex = 2;
        
        if (status && status !== 'all') {
            countQuery += ` AND status = $${countIndex}`;
            countParams.push(status);
            countIndex++;
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = getFirstRow(countResult)?.total || 0;
        
        console.log(`✅ Found ${leads?.length || 0} leads, total: ${total}`);
        res.json({
            leads: leads || [],
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting manager leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلبات', error: error.message });
    }
};

// =============================================
// تحديث حالة طلب
// =============================================
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status, notes } = req.body;
        const managerId = req.user.id;
        
        const validStatuses = ['pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        console.log(`🔄 Updating lead ${leadId} to status: ${status}`);
        
        // Update lead status
        let updateQuery = `UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP`;
        const updateParams = [status];
        let paramIndex = 2;
        
        if (status === 'contacted') {
            updateQuery += `, contacted_by = $${paramIndex}, contacted_at = CURRENT_TIMESTAMP`;
            updateParams.push(managerId);
            paramIndex++;
        } else if (status === 'sent_to_operations') {
            updateQuery += `, sent_to_operations_by = $${paramIndex}, sent_to_operations_at = CURRENT_TIMESTAMP`;
            updateParams.push(managerId);
            paramIndex++;
        }
        
        if (notes) {
            updateQuery += `, notes = COALESCE(notes, '') || '\n' || $${paramIndex}`;
            updateParams.push(`[${new Date().toISOString()}] ${notes}`);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex}`;
        updateParams.push(leadId);
        
        await db.query(updateQuery, updateParams);
        
        console.log(`✅ Lead ${leadId} updated to ${status}`);
        res.json({ 
            message: 'تم تحديث حالة الطلب بنجاح',
            leadId,
            status
        });
        
    } catch (error) {
        console.error('❌ Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الحالة', error: error.message });
    }
};

// =============================================
// الحصول على إحصائيات المدير
// =============================================
exports.getManagerStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.role;
        
        console.log(`📈 Getting stats for manager ${managerId} (${role})`);
        
        // ✅ إزالة assigned_to - نستخدم created_by
        const query = `
            SELECT 
                COUNT(CASE WHEN status = 'pending' AND created_by = $1 THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'approved' AND created_by = $1 THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'contacted' AND created_by = $1 THEN 1 END) as contacted,
                COUNT(CASE WHEN status = 'sent_to_operations' AND created_by = $1 THEN 1 END) as sent_to_operations,
                COUNT(CASE WHEN status = 'assigned_to_company' AND created_by = $1 THEN 1 END) as assigned_to_company,
                COUNT(CASE WHEN status = 'completed' AND created_by = $1 THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'cancelled' AND created_by = $1 THEN 1 END) as cancelled,
                COALESCE(SUM(CASE WHEN status = 'completed' AND created_by = $1 THEN commission_amount ELSE 0 END), 0) as total_commission
            FROM leads
            WHERE created_by = $1
        `;
        
        const result = await db.query(query, [managerId]);
        const stats = getFirstRow(result) || { 
            pending: 0, approved: 0, contacted: 0,
            sent_to_operations: 0, assigned_to_company: 0,
            completed: 0, cancelled: 0, total_commission: 0
        };
        
        console.log(`📊 Stats: pending=${stats.pending}, completed=${stats.completed}, commission=${stats.total_commission}`);
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting manager stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// إرسال الطلب لمدير العمليات
// =============================================
exports.sendToOperationsManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        console.log(`📤 Executive ${executiveId} sending lead ${leadId} to operations manager`);
        
        // Check if lead exists
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(resultLead);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // Calculate commission (150 DT per kW)
        const commission = lead.commission_amount || (lead.required_kw * 150);
        
        console.log(`💰 Commission for lead ${leadId}: ${commission} TND`);
        
        // Update lead status to sent_to_operations
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations', 
                 sent_to_operations_by = $1,
                 sent_to_operations_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [executiveId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} sent to operations manager`);
        
        res.json({ 
            message: `تم إرسال الطلب لمدير العمليات`,
            leadId,
            commission: commission
        });
        
    } catch (error) {
        console.error('❌ Error sending to operations:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير العمليات', error: error.message });
    }
};

// =============================================
// إضافة ملاحظات للطلب
// =============================================
exports.addLeadNote = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const managerId = req.user.id;
        
        if (!notes) {
            return res.status(400).json({ message: 'الملاحظات مطلوبة' });
        }
        
        const existingResult = await db.query(
            'SELECT id FROM leads WHERE id = $1 AND created_by = $2',
            [leadId, managerId]
        );
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود أو غير مصرح به' });
        }
        
        await db.query(
            `UPDATE leads 
             SET notes = COALESCE(notes, '') || '\n' || $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [`[${new Date().toISOString()}] المستخدم ${managerId}: ${notes}`, leadId]
        );
        
        console.log(`✅ Note added to lead ${leadId}`);
        res.json({ message: 'تم إضافة الملاحظة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error adding note:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الملاحظة', error: error.message });
    }
};

// =============================================
// قبول الطلب وإرساله لمدير العمليات
// =============================================
exports.acceptLeadAndSend = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        console.log(`✅ Executive ${executiveId} accepting lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(resultLead);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const commission = lead.commission_amount || (lead.required_kw * 150);
        
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations', 
                 contacted_by = $1,
                 contacted_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [executiveId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} accepted and sent to operations`);
        
        res.json({ 
            message: `تم قبول الطلب وإرساله لمدير العمليات`,
            leadId,
            commission: commission
        });
        
    } catch (error) {
        console.error('❌ Error accepting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في قبول الطلب', error: error.message });
    }
};