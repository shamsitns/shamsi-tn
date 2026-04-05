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
// لوحة تحكم الشركة - جلب الطلبات المعينة لها
// =============================================

// الحصول على طلبات الشركة الحالية
exports.getMyLeads = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`🏢 Company ${companyId} fetching leads, status: ${status}`);
        
        let query = `
            SELECT l.*, 
                   lc.status as assignment_status,
                   lc.assigned_at,
                   lc.notes as assignment_notes,
                   lc.commission_rate,
                   u.name as assigned_by_name
            FROM leads l
            JOIN lead_companies lc ON l.id = lc.lead_id
            LEFT JOIN users u ON lc.assigned_by = u.id
            WHERE lc.company_id = $1
        `;
        const queryParams = [companyId];
        let paramIndex = 2;
        
        if (status && status !== 'all') {
            query += ` AND lc.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY lc.assigned_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = getRows(result);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM lead_companies lc 
            WHERE lc.company_id = $1
        `;
        const countParams = [companyId];
        let countIndex = 2;
        
        if (status && status !== 'all') {
            countQuery += ` AND lc.status = $${countIndex}`;
            countParams.push(status);
            countIndex++;
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = getFirstRow(countResult)?.total || 0;
        
        console.log(`✅ Found ${leads?.length || 0} leads for company ${companyId}`);
        
        res.json({
            leads: leads || [],
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting company leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلبات', error: error.message });
    }
};

// =============================================
// تحديث حالة الطلب (قبول/رفض/إكمال)
// =============================================
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status, notes } = req.body;
        const companyId = req.user.company_id;
        
        const validStatuses = ['accepted', 'rejected', 'in_progress', 'completed'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        // التحقق من أن الطلب معين لهذه الشركة
        const existingResult = await db.query(
            'SELECT id FROM lead_companies WHERE lead_id = $1 AND company_id = $2',
            [leadId, companyId]
        );
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الطلب غير معين لشركتك' });
        }
        
        // تحديث حالة التعيين
        await db.query(
            `UPDATE lead_companies 
             SET status = $1, 
                 notes = COALESCE(notes, '') || '\n' || $2,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE lead_id = $3 AND company_id = $4`,
            [status, `[${new Date().toISOString()}] تم تحديث الحالة إلى: ${status}`, leadId, companyId]
        );
        
        // تحديث حالة الطلب الرئيسية
        let leadStatus = 'assigned_to_company';
        if (status === 'accepted') {
            leadStatus = 'in_progress';
        } else if (status === 'completed') {
            leadStatus = 'completed';
        } else if (status === 'rejected') {
            leadStatus = 'cancelled';
        }
        
        await db.query(
            `UPDATE leads 
             SET status = $1, 
                 installation_status = $2,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [leadStatus, status, leadId]
        );
        
        console.log(`✅ Lead ${leadId} status updated to ${status} by company ${companyId}`);
        
        res.json({ 
            message: `تم تحديث حالة الطلب إلى: ${status}`,
            leadId,
            status
        });
        
    } catch (error) {
        console.error('❌ Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الحالة', error: error.message });
    }
};

// =============================================
// الحصول على إحصائيات الشركة
// =============================================
exports.getMyStats = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_leads,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM lead_companies
            WHERE company_id = $1
        `, [companyId]);
        
        const stats = getFirstRow(result) || {};
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting company stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// الحصول على تفاصيل طلب محدد
// =============================================
exports.getLeadDetails = async (req, res) => {
    try {
        const { leadId } = req.params;
        const companyId = req.user.company_id;
        
        const result = await db.query(`
            SELECT l.*, 
                   lc.status as assignment_status,
                   lc.assigned_at,
                   lc.notes as assignment_notes,
                   lc.commission_rate,
                   u.name as assigned_by_name
            FROM leads l
            JOIN lead_companies lc ON l.id = lc.lead_id
            LEFT JOIN users u ON lc.assigned_by = u.id
            WHERE l.id = $1 AND lc.company_id = $2
        `, [leadId, companyId]);
        
        const lead = getFirstRow(result);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود أو غير معين لشركتك' });
        }
        
        res.json(lead);
        
    } catch (error) {
        console.error('❌ Error getting lead details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب', error: error.message });
    }
};

// =============================================
// ✅ تحديث العمولة للطلب
// =============================================
exports.updateCommission = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { commission_rate, notes } = req.body;
        const companyId = req.user.company_id;
        
        if (!commission_rate || commission_rate < 0) {
            return res.status(400).json({ message: 'العمولة غير صالحة' });
        }
        
        // التحقق من أن الطلب معين لهذه الشركة
        const existingResult = await db.query(
            'SELECT id, commission_rate FROM lead_companies WHERE lead_id = $1 AND company_id = $2',
            [leadId, companyId]
        );
        const existing = getFirstRow(existingResult);
        
        if (!existing) {
            return res.status(404).json({ message: 'الطلب غير معين لشركتك' });
        }
        
        // تحديث العمولة في lead_companies
        await db.query(
            `UPDATE lead_companies 
             SET commission_rate = $1,
                 notes = COALESCE(notes, '') || '\n' || $2,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE lead_id = $3 AND company_id = $4`,
            [commission_rate, `[${new Date().toISOString()}] تم تحديث العمولة إلى: ${commission_rate} دينار`, leadId, companyId]
        );
        
        // تحديث عمولة الـ lead الرئيسي
        await db.query(
            `UPDATE leads SET commission_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [commission_rate, leadId]
        );
        
        console.log(`✅ Commission updated for lead ${leadId} to ${commission_rate} by company ${companyId}`);
        
        res.json({ 
            message: `تم تحديث العمولة إلى ${commission_rate} دينار`,
            leadId,
            commission_rate
        });
        
    } catch (error) {
        console.error('❌ Error updating commission:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث العمولة', error: error.message });
    }
};