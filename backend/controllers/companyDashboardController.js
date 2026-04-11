const db = require('../config/database');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// الحصول على طلبات الشركة (المعدل لمنع التكرار)
exports.getMyLeads = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        // جلب company_id من جدول companies باستخدام البريد الإلكتروني
        const companyResult = await db.query(`
            SELECT id FROM companies WHERE email = $1
        `, [userEmail]);
        
        const companyId = getFirstRow(companyResult)?.id;
        
        if (!companyId) {
            return res.status(400).json({ message: 'لا توجد شركة مرتبطة بهذا الحساب' });
        }
        
        // ✅ استخدام DISTINCT ON لمنع التكرار
        const result = await db.query(`
            SELECT DISTINCT ON (l.id) 
                l.*, 
                lc.assigned_at, 
                lc.status as assignment_status,
                lc.notes as assignment_notes
            FROM leads l
            INNER JOIN lead_companies lc ON l.id = lc.lead_id
            WHERE lc.company_id = $1
            ORDER BY l.id, lc.assigned_at DESC
        `, [companyId]);
        
        const leads = getRows(result);
        res.json({ leads });
        
    } catch (error) {
        console.error('Error fetching my leads:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في جلب الطلبات', 
            error: error.message 
        });
    }
};

// تحديث حالة الطلب
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        const validStatuses = ['pending', 'accepted', 'rejected', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        // جلب company_id من جدول companies
        const companyResult = await db.query(`
            SELECT id FROM companies WHERE email = $1
        `, [userEmail]);
        
        const companyId = getFirstRow(companyResult)?.id;
        
        if (!companyId) {
            return res.status(400).json({ message: 'لا توجد شركة مرتبطة بهذا الحساب' });
        }
        
        // تحديث lead_companies
        await db.query(`
            UPDATE lead_companies 
            SET status = $1, 
                notes = COALESCE(notes, '') || CASE WHEN $2 IS NOT NULL THEN E'\n' || $2 ELSE '' END,
                updated_at = CURRENT_TIMESTAMP 
            WHERE lead_id = $3 AND company_id = $4
        `, [status, notes || null, leadId, companyId]);
        
        // تحديث leads.status بناءً على الحالة
        let leadStatus = null;
        if (status === 'accepted') {
            leadStatus = 'assigned_to_company';
        } else if (status === 'rejected') {
            leadStatus = 'cancelled';
        } else if (status === 'in_progress') {
            leadStatus = 'in_progress';
        } else if (status === 'completed') {
            leadStatus = 'completed';
        }
        
        if (leadStatus) {
            await db.query(`
                UPDATE leads 
                SET status = $1, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2
            `, [leadStatus, leadId]);
        }
        
        console.log(`✅ Lead ${leadId} status updated to ${status} by company ${companyId}`);
        
        res.json({ 
            message: 'تم تحديث الحالة بنجاح',
            status: status,
            leadId: leadId
        });
        
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في تحديث الحالة',
            error: error.message 
        });
    }
};

// الحصول على إحصائيات الشركة
exports.getMyStats = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        const companyResult = await db.query(`
            SELECT id FROM companies WHERE email = $1
        `, [userEmail]);
        
        const companyId = getFirstRow(companyResult)?.id;
        
        if (!companyId) {
            return res.status(400).json({ message: 'لا توجد شركة مرتبطة بهذا الحساب' });
        }
        
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_leads,
                COUNT(CASE WHEN lc.status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN lc.status = 'accepted' THEN 1 END) as accepted,
                COUNT(CASE WHEN lc.status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN lc.status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN lc.status = 'completed' THEN 1 END) as completed,
                COALESCE(SUM(l.commission_amount), 0) as total_commission
            FROM lead_companies lc
            JOIN leads l ON lc.lead_id = l.id
            WHERE lc.company_id = $1
        `, [companyId]);
        
        const stats = getFirstRow(result) || {};
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات' });
    }
};

// تفاصيل طلب محدد
exports.getLeadDetails = async (req, res) => {
    try {
        const { leadId } = req.params;
        const result = await db.query(`
            SELECT l.*, lc.assigned_at, lc.status as assignment_status, lc.notes as assignment_notes
            FROM leads l
            JOIN lead_companies lc ON l.id = lc.lead_id
            WHERE l.id = $1
        `, [leadId]);
        
        const lead = getFirstRow(result);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        res.json(lead);
    } catch (error) {
        console.error('Error fetching lead details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب' });
    }
};

// تحديث عمولة الطلب (تعديل يدوي)
exports.updateCommission = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { commission } = req.body;
        
        if (commission === undefined || commission < 0) {
            return res.status(400).json({ message: 'قيمة العمولة غير صالحة' });
        }
        
        await db.query(
            `UPDATE leads SET commission_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [commission, leadId]
        );
        
        res.json({ message: 'تم تحديث العمولة بنجاح' });
    } catch (error) {
        console.error('Error updating commission:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث العمولة' });
    }
};

// الحصول على نسبة العمولة للشركة (دينار/كيلوواط)
exports.getCommissionRate = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        const companyResult = await db.query(`
            SELECT id FROM companies WHERE email = $1
        `, [userEmail]);
        
        const companyId = getFirstRow(companyResult)?.id;
        
        if (!companyId) {
            return res.status(400).json({ message: 'لا توجد شركة مرتبطة بهذا الحساب' });
        }
        
        const result = await db.query('SELECT commission_rate FROM companies WHERE id = $1', [companyId]);
        const rate = getFirstRow(result)?.commission_rate || 0;
        res.json({ commission_rate: parseFloat(rate) });
    } catch (error) {
        console.error('Error getting commission rate:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب نسبة العمولة' });
    }
};

// تحديث نسبة العمولة للشركة
exports.updateCommissionRate = async (req, res) => {
    try {
        const { commission_rate } = req.body;
        if (commission_rate === undefined || commission_rate < 0) {
            return res.status(400).json({ message: 'نسبة العمولة يجب أن تكون رقماً موجباً' });
        }
        
        const userEmail = req.user.email;
        
        const companyResult = await db.query(`
            SELECT id FROM companies WHERE email = $1
        `, [userEmail]);
        
        const companyId = getFirstRow(companyResult)?.id;
        
        if (!companyId) {
            return res.status(400).json({ message: 'لا توجد شركة مرتبطة بهذا الحساب' });
        }
        
        await db.query(
            `UPDATE companies SET commission_rate = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [commission_rate, companyId]
        );
        
        res.json({ message: 'تم تحديث نسبة العمولة بنجاح', commission_rate: parseFloat(commission_rate) });
    } catch (error) {
        console.error('Error updating commission rate:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث نسبة العمولة' });
    }
};