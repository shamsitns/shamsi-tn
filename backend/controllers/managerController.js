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
// الحصول على طلبات المدير
// =============================================
exports.getMyLeads = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.role;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Manager ${managerId} (${role}) fetching leads, status: ${status}`);
        
        let query = `SELECT l.* FROM leads l WHERE 1=1`;
        const queryParams = [];
        let paramIndex = 1;
        
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            query += ` AND (l.assigned_to = $${paramIndex} OR l.created_by = $${paramIndex})`;
            queryParams.push(managerId);
            paramIndex++;
        }
        
        if (status && status !== 'all') {
            query += ` AND l.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = getRows(result);
        
        let countQuery = `SELECT COUNT(*) as total FROM leads WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            countQuery += ` AND (assigned_to = $${countIndex} OR created_by = $${countIndex})`;
            countParams.push(managerId);
            countIndex++;
        }
        
        if (status && status !== 'all') {
            countQuery += ` AND status = $${countIndex}`;
            countParams.push(status);
            countIndex++;
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = getFirstRow(countResult)?.total || 0;
        
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
        const leadId = req.params.id || req.params.leadId;
        const { status, notes } = req.body;
        const managerId = req.user.id;
        
        const validStatuses = ['pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
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
        res.json({ message: 'تم تحديث حالة الطلب بنجاح', leadId, status });
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
        let query = `
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
                COUNT(CASE WHEN status = 'sent_to_operations' THEN 1 END) as sent_to_operations,
                COUNT(CASE WHEN status = 'assigned_to_company' THEN 1 END) as assigned_to_company,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END), 0) as total_commission
            FROM leads
            WHERE created_by = $1 OR assigned_to = $1
        `;
        const result = await db.query(query, [managerId]);
        const stats = getFirstRow(result) || { pending:0, approved:0, contacted:0, sent_to_operations:0, assigned_to_company:0, completed:0, cancelled:0, total_commission:0 };
        res.json(stats);
    } catch (error) {
        console.error('❌ Error getting manager stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// إرسال طلب لشركة (لـ Operations Manager)
// =============================================
exports.assignToCompany = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const { companyId, notes } = req.body;
        const managerId = 4; // ✅ معرف مدير العمليات الثابت

        console.log(`🏢 Assigning lead ${leadId} to company ${companyId} by user ${managerId}`);

        await db.query(
            `UPDATE leads SET status = 'assigned_to_company', assigned_company_id = $1, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [companyId, leadId]
        );

        const existing = await db.query('SELECT id FROM lead_companies WHERE lead_id = $1 AND company_id = $2', [leadId, companyId]);
        if (getRows(existing).length > 0) {
            await db.query(
                `UPDATE lead_companies SET assigned_by = $1, notes = $2, status = 'assigned', assigned_at = CURRENT_TIMESTAMP WHERE lead_id = $3 AND company_id = $4`,
                [managerId, notes || null, leadId, companyId]
            );
        } else {
            await db.query(
                `INSERT INTO lead_companies (lead_id, company_id, assigned_by, notes, status, assigned_at) VALUES ($1, $2, $3, $4, 'assigned', CURRENT_TIMESTAMP)`,
                [leadId, companyId, managerId, notes || null]
            );
        }

        res.json({ message: 'تم إرسال الطلب للشركة بنجاح' });
    } catch (error) {
        console.error('❌ Error assigning to company:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب للشركة', error: error.message });
    }
};

// =============================================
// الحصول على تفاصيل طلب محدد للمدير
// =============================================
exports.getLeadDetails = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const result = await db.query(`
            SELECT l.*, c.name as company_name, c.phone as company_phone, c.address as company_address
            FROM leads l LEFT JOIN companies c ON l.assigned_company_id = c.id WHERE l.id = $1
        `, [leadId]);
        const lead = getFirstRow(result);
        if (!lead) return res.status(404).json({ message: 'الطلب غير موجود' });
        res.json(lead);
    } catch (error) {
        console.error('❌ Error getting lead details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب', error: error.message });
    }
};

// =============================================
// الحصول على قائمة الشركات المتاحة
// =============================================
exports.getAvailableCompanies = async (req, res) => {
    try {
        const result = await db.query(`SELECT id, name, phone, address, contact_person, is_active FROM companies WHERE is_active = 1 ORDER BY name ASC`);
        res.json(getRows(result));
    } catch (error) {
        console.error('❌ Error getting available companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات', error: error.message });
    }
};

// =============================================
// إرسال الطلب لمدير العمليات (للمدير التنفيذي)
// =============================================
exports.sendToOperationsManager = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        const lead = getFirstRow(await db.query('SELECT * FROM leads WHERE id = $1', [leadId]));
        if (!lead) return res.status(404).json({ message: 'الطلب غير موجود' });
        
        const opsManager = getFirstRow(await db.query("SELECT id, name FROM users WHERE role = 'operations_manager' AND is_active = true LIMIT 1"));
        if (!opsManager) return res.status(404).json({ message: 'لا يوجد مدير عمليات متاح' });
        
        const commission = lead.commission_amount || (lead.required_kw * 150);
        await db.query(`UPDATE leads SET status = 'sent_to_operations', assigned_to = $1, sent_to_operations_by = $2, sent_to_operations_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [opsManager.id, executiveId, leadId]);
        
        res.json({ message: `تم إرسال الطلب لمدير العمليات (العمولة: ${commission} دينار)`, leadId, commission, operationsManagerId: opsManager.id, operationsManagerName: opsManager.name });
    } catch (error) {
        console.error('❌ Error sending to operations:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير العمليات', error: error.message });
    }
};

// =============================================
// قبول الطلب وإرساله لمدير العمليات
// =============================================
exports.acceptLeadAndSendToOperations = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        const lead = getFirstRow(await db.query('SELECT * FROM leads WHERE id = $1', [leadId]));
        if (!lead) return res.status(404).json({ message: 'الطلب غير موجود' });
        
        const opsManager = getFirstRow(await db.query("SELECT id, name FROM users WHERE role = 'operations_manager' AND is_active = true LIMIT 1"));
        if (!opsManager) return res.status(404).json({ message: 'لا يوجد مدير عمليات متاح' });
        
        const commission = lead.commission_amount || (lead.required_kw * 150);
        await db.query(`UPDATE leads SET status = 'sent_to_operations', assigned_to = $1, contacted_by = $2, contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [opsManager.id, executiveId, leadId]);
        
        res.json({ message: `تم قبول الطلب وإرساله لمدير العمليات (العمولة: ${commission} دينار)`, leadId, commission, operationsManagerId: opsManager.id, operationsManagerName: opsManager.name });
    } catch (error) {
        console.error('❌ Error accepting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في قبول الطلب', error: error.message });
    }
};

// =============================================
// إضافة ملاحظات للطلب
// =============================================
exports.addLeadNote = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const { notes } = req.body;
        const managerId = req.user.id;
        if (!notes) return res.status(400).json({ message: 'الملاحظات مطلوبة' });
        
        const existing = await db.query('SELECT id FROM leads WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)', [leadId, managerId]);
        if (getRows(existing).length === 0) return res.status(404).json({ message: 'الطلب غير موجود أو غير مصرح به' });
        
        await db.query(`UPDATE leads SET notes = COALESCE(notes, '') || '\n' || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [`[${new Date().toISOString()}] المستخدم ${managerId}: ${notes}`, leadId]);
        res.json({ message: 'تم إضافة الملاحظة بنجاح' });
    } catch (error) {
        console.error('❌ Error adding note:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الملاحظة', error: error.message });
    }
};

// =============================================
// قبول الطلب وإرساله (اختصار)
// =============================================
exports.acceptLeadAndSend = async (req, res) => {
    try {
        const leadId = req.params.id || req.params.leadId;
        const executiveId = req.user.id;
        const lead = getFirstRow(await db.query('SELECT * FROM leads WHERE id = $1', [leadId]));
        if (!lead) return res.status(404).json({ message: 'الطلب غير موجود' });
        
        const commission = lead.commission_amount || (lead.required_kw * 150);
        await db.query(`UPDATE leads SET status = 'sent_to_operations', contacted_by = $1, contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [executiveId, leadId]);
        res.json({ message: `تم قبول الطلب وإرساله لمدير العمليات`, leadId, commission });
    } catch (error) {
        console.error('❌ Error accepting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في قبول الطلب', error: error.message });
    }
};

// =============================================
// تسجيل التواصل مع العميل (لمركز الاتصال)
// =============================================
exports.markAsContacted = async (req, res) => {
    try {
        const leadId = req.params.id;
        const { notes } = req.body;
        const userId = req.user.id;
        const lead = getFirstRow(await db.query('SELECT * FROM leads WHERE id = $1', [leadId]));
        if (!lead) return res.status(404).json({ message: 'الطلب غير موجود' });
        
        await db.query(`UPDATE leads SET status = 'contacted', contacted_by = $1, contacted_at = CURRENT_TIMESTAMP, notes = COALESCE(notes, '') || '\n' || $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [userId, `[${new Date().toISOString()}] تم التواصل مع العميل: ${notes || 'تم التواصل بنجاح'}`, leadId]);
        res.json({ message: 'تم تسجيل التواصل مع العميل بنجاح', leadId, status: 'contacted' });
    } catch (error) {
        console.error('❌ Error marking as contacted:', error);
        res.status(500).json({ message: 'حدث خطأ في تسجيل التواصل', error: error.message });
    }
};

// =============================================
// تصدير الطلبات إلى CSV
// =============================================
exports.exportLeads = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.role;
        let query = `
            SELECT l.id, l.name, l.phone, l.city, l.property_type, l.bill_amount, l.required_kw, l.panels_count, l.status, l.created_at, l.assigned_company_id, c.name as company_name
            FROM leads l LEFT JOIN companies c ON l.assigned_company_id = c.id WHERE 1=1
        `;
        const params = [];
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            query += ` AND (l.created_by = $1 OR l.assigned_to = $1)`;
            params.push(managerId);
        }
        query += ` ORDER BY l.created_at DESC`;
        const result = await db.query(query, params);
        const leads = getRows(result);
        const csvHeaders = ['ID','الاسم','الهاتف','المدينة','نوع العقار','قيمة الفاتورة','القدرة (kWp)','عدد الألواح','الحالة','تاريخ الإنشاء','الشركة'];
        const csvRows = leads.map(lead => [lead.id, lead.name, lead.phone, lead.city||'', lead.property_type, lead.bill_amount, lead.required_kw||'', lead.panels_count||'', lead.status, new Date(lead.created_at).toLocaleDateString('ar-TN'), lead.company_name||'']);
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=leads_${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csvContent);
    } catch (error) {
        console.error('❌ Error exporting leads:', error);
        res.status(500).json({ message: 'حدث خطأ في تصدير الطلبات', error: error.message });
    }
};

// =============================================
// الحصول على نسبة عمولة شركة معينة
// =============================================
exports.getCompanyCommissionRate = async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await db.query('SELECT commission_rate FROM companies WHERE id = $1', [companyId]);
        const rate = getFirstRow(result)?.commission_rate || 0;
        res.json({ commission_rate: parseFloat(rate) });
    } catch (error) {
        console.error('Error getting company commission rate:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب نسبة العمولة' });
    }
};

// =============================================
// تحديث عمولة طلب معين
// =============================================
exports.updateLeadCommission = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { commission } = req.body;
        if (commission === undefined || commission < 0) return res.status(400).json({ message: 'قيمة العمولة غير صالحة' });
        await db.query(`UPDATE leads SET commission_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [commission, leadId]);
        res.json({ message: 'تم تحديث العمولة بنجاح' });
    } catch (error) {
        console.error('Error updating lead commission:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث العمولة' });
    }
};