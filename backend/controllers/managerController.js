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
        
        let query = `
            SELECT l.*
            FROM leads l
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;
        
        // Filter by assigned_to for managers
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            query += ` AND l.assigned_to = $${paramIndex}`;
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
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM leads WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            countQuery += ` AND assigned_to = $${countIndex}`;
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
// الحصول على إحصائيات المدير (مع العمولة)
// =============================================
exports.getManagerStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const role = req.user.role;
        
        console.log(`📈 Getting stats for manager ${managerId} (${role})`);
        
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
        `;
        
        // If manager has assigned_to filter
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            query = `
                SELECT 
                    COUNT(CASE WHEN status = 'pending' AND assigned_to = $1 THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' AND assigned_to = $1 THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'contacted' AND assigned_to = $1 THEN 1 END) as contacted,
                    COUNT(CASE WHEN status = 'sent_to_operations' AND assigned_to = $1 THEN 1 END) as sent_to_operations,
                    COUNT(CASE WHEN status = 'assigned_to_company' AND assigned_to = $1 THEN 1 END) as assigned_to_company,
                    COUNT(CASE WHEN status = 'completed' AND assigned_to = $1 THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'cancelled' AND assigned_to = $1 THEN 1 END) as cancelled,
                    COALESCE(SUM(CASE WHEN status = 'completed' AND assigned_to = $1 THEN commission_amount ELSE 0 END), 0) as total_commission
                FROM leads
                WHERE assigned_to = $1
            `;
        }
        
        const result = await db.query(query, role === 'executive_manager' || role === 'operations_manager' || role === 'call_center' ? [managerId] : []);
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
// إرسال طلب لشركة (لـ Operations Manager)
// =============================================
exports.assignToCompany = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { companyId, notes } = req.body;
        const managerId = req.user.id;
        
        console.log(`🏢 Assigning lead ${leadId} to company ${companyId}`);
        
        // Check if lead exists
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(resultLead);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // Check if company exists
        const resultCompany = await db.query('SELECT id, name FROM companies WHERE id = $1', [companyId]);
        const company = getFirstRow(resultCompany);
        if (!company) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        // Update lead with company
        await db.query(
            `UPDATE leads 
             SET status = 'assigned_to_company', 
                 assigned_company_id = $1, 
                 assigned_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [companyId, leadId]
        );
        
        // Check if lead_company assignment exists
        const resultExisting = await db.query(
            `SELECT id FROM lead_companies 
             WHERE lead_id = $1 AND company_id = $2`,
            [leadId, companyId]
        );
        const existing = getRows(resultExisting);
        
        if (existing && existing.length > 0) {
            await db.query(
                `UPDATE lead_companies 
                 SET assigned_by = $1, notes = $2, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
                 WHERE lead_id = $3 AND company_id = $4`,
                [managerId, notes || null, leadId, companyId]
            );
        } else {
            await db.query(
                `INSERT INTO lead_companies (lead_id, company_id, assigned_by, notes, status, assigned_at) 
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [leadId, companyId, managerId, notes || null, 'assigned']
            );
        }
        
        console.log(`✅ Lead ${leadId} assigned to company ${company.name}`);
        res.json({ 
            message: `تم إرسال الطلب للشركة: ${company.name}`,
            leadId,
            companyId,
            companyName: company.name
        });
        
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
        const { leadId } = req.params;
        
        const result = await db.query(`
            SELECT l.*, 
                   c.name as company_name,
                   c.phone as company_phone,
                   c.address as company_address
            FROM leads l
            LEFT JOIN companies c ON l.assigned_company_id = c.id
            WHERE l.id = $1
        `, [leadId]);
        
        const lead = getFirstRow(result);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
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
        const result = await db.query(`
            SELECT id, name, phone, address, contact_person, is_active 
            FROM companies 
            WHERE is_active = true
            ORDER BY name ASC
        `);
        
        const companies = getRows(result);
        res.json(companies || []);
        
    } catch (error) {
        console.error('❌ Error getting available companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات', error: error.message });
    }
};

// =============================================
// إرسال الطلب لمدير العمليات (للمدير التنفيذي) - مع نقل جميع المعلومات
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
        
        console.log(`💰 Commission for lead ${leadId}: ${commission} TND (${lead.required_kw} kW × 150)`);
        
        // Find an operations manager
        const resultOps = await db.query(`
            SELECT id, name FROM users 
            WHERE role = 'operations_manager' AND is_active = true
            ORDER BY id ASC LIMIT 1
        `);
        const operationsManager = getFirstRow(resultOps);
        
        if (!operationsManager) {
            return res.status(404).json({ message: 'لا يوجد مدير عمليات متاح' });
        }
        
        // تجميع جميع المعلومات لنقلها لمدير العمليات
        const fullNotes = `
📋 معلومات الطلب الكاملة من المدير التنفيذي:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 معلومات العميل:
   • الاسم: ${lead.name}
   • الهاتف: ${lead.phone}
   • المدينة: ${lead.city || 'غير مدخلة'}

⚡ معلومات الكهرباء:
   • قيمة الفاتورة: ${lead.bill_amount} دينار
   • فترة الفاتورة: ${lead.bill_period_months === 60 ? 'شهرين' : 'شهر'}

☀️ نتائج الدراسة:
   • القدرة المطلوبة: ${lead.required_kw} kWp
   • عدد الألواح: ${lead.panels_count}
   • العمولة: ${commission} دينار

📝 معلومات إضافية من العميل:
${lead.additional_info || 'لا توجد معلومات إضافية'}

${notes ? `\n📌 ملاحظات المدير التنفيذي:\n${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        // Update lead status
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations', 
                 assigned_to = $1, 
                 sent_to_operations_by = $2,
                 sent_to_operations_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [operationsManager.id, executiveId, leadId]
        );
        
        // إضافة سجل التعيين مع جميع المعلومات
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes) 
             VALUES ($1, $2, $3, $4)`,
            [leadId, operationsManager.id, executiveId, fullNotes]
        );
        
        console.log(`✅ Lead ${leadId} sent to operations manager with commission ${commission}`);
        
        res.json({ 
            message: `تم إرسال الطلب لمدير العمليات (العمولة: ${commission} دينار)`,
            leadId,
            commission: commission,
            leadInfo: {
                name: lead.name,
                phone: lead.phone,
                city: lead.city,
                bill_amount: lead.bill_amount,
                required_kw: lead.required_kw,
                panels_count: lead.panels_count,
                additional_info: lead.additional_info
            }
        });
        
    } catch (error) {
        console.error('❌ Error sending to operations:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير العمليات', error: error.message });
    }
};

// =============================================
// قبول الطلب وإرساله لمدير العمليات (للمدير التنفيذي)
// =============================================
exports.acceptLeadAndSendToOperations = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        console.log(`✅ Executive ${executiveId} accepting lead ${leadId} and sending to operations`);
        
        // Check if lead exists
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(resultLead);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // Calculate commission (150 DT per kW)
        const commission = lead.commission_amount || (lead.required_kw * 150);
        
        // Find an operations manager
        const resultOps = await db.query(`
            SELECT id, name FROM users 
            WHERE role = 'operations_manager' AND is_active = true
            ORDER BY id ASC LIMIT 1
        `);
        const operationsManager = getFirstRow(resultOps);
        
        if (!operationsManager) {
            return res.status(404).json({ message: 'لا يوجد مدير عمليات متاح' });
        }
        
        // تجميع جميع المعلومات لنقلها لمدير العمليات
        const fullNotes = `
📋 معلومات الطلب الكاملة (مقبول من المدير التنفيذي):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ تم قبول الطلب من قبل المدير التنفيذي

👤 معلومات العميل:
   • الاسم: ${lead.name}
   • الهاتف: ${lead.phone}
   • المدينة: ${lead.city || 'غير مدخلة'}

⚡ معلومات الكهرباء:
   • قيمة الفاتورة: ${lead.bill_amount} دينار
   • فترة الفاتورة: ${lead.bill_period_months === 60 ? 'شهرين' : 'شهر'}

☀️ نتائج الدراسة:
   • القدرة المطلوبة: ${lead.required_kw} kWp
   • عدد الألواح: ${lead.panels_count}
   • العمولة: ${commission} دينار

📝 معلومات إضافية من العميل:
${lead.additional_info || 'لا توجد معلومات إضافية'}

${notes ? `\n📌 ملاحظات المدير التنفيذي:\n${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        // Update lead status
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations', 
                 assigned_to = $1, 
                 contacted_by = $2,
                 contacted_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [operationsManager.id, executiveId, leadId]
        );
        
        // إضافة سجل التعيين مع جميع المعلومات
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes) 
             VALUES ($1, $2, $3, $4)`,
            [leadId, operationsManager.id, executiveId, fullNotes]
        );
        
        console.log(`✅ Lead ${leadId} accepted and sent to operations manager with commission ${commission}`);
        
        res.json({ 
            message: `تم قبول الطلب وإرساله لمدير العمليات (العمولة: ${commission} دينار)`,
            leadId,
            commission: commission,
            leadInfo: {
                name: lead.name,
                phone: lead.phone,
                city: lead.city,
                bill_amount: lead.bill_amount,
                required_kw: lead.required_kw,
                panels_count: lead.panels_count,
                additional_info: lead.additional_info
            }
        });
        
    } catch (error) {
        console.error('❌ Error accepting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في قبول الطلب', error: error.message });
    }
};

// =============================================
// ✅ الدوال الجديدة المضافة (لتوافق مع routes)
// =============================================

// إضافة ملاحظات للطلب
exports.addLeadNote = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const managerId = req.user.id;
        
        if (!notes) {
            return res.status(400).json({ message: 'الملاحظات مطلوبة' });
        }
        
        const existingResult = await db.query(
            'SELECT id FROM leads WHERE id = $1 AND assigned_to = $2',
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

// قبول الطلب وإرساله (اختصار)
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

// =============================================
// تسجيل التواصل مع العميل (لمركز الاتصال)
// =============================================
exports.markAsContacted = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = req.user.id;
        
        console.log(`📞 User ${userId} marking lead ${id} as contacted`);
        
        const resultLead = await db.query(
            'SELECT * FROM leads WHERE id = $1',
            [id]
        );
        const lead = getFirstRow(resultLead);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'contacted', 
                 contacted_by = $1,
                 contacted_at = CURRENT_TIMESTAMP,
                 notes = COALESCE(notes, '') || '\n' || $2,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [userId, `[${new Date().toISOString()}] تم التواصل مع العميل: ${notes || 'تم التواصل بنجاح'}`, id]
        );
        
        console.log(`✅ Lead ${id} marked as contacted by user ${userId}`);
        res.json({ 
            message: 'تم تسجيل التواصل مع العميل بنجاح',
            leadId: id,
            status: 'contacted'
        });
        
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
        
        console.log(`📊 Exporting leads by manager ${managerId}`);
        
        let query = `
            SELECT 
                l.id, l.name, l.phone, l.city, l.property_type,
                l.bill_amount, l.required_kw, l.panels_count,
                l.status, l.created_at, l.assigned_company_id,
                c.name as company_name
            FROM leads l
            LEFT JOIN companies c ON l.assigned_company_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;
        
        if (role === 'executive_manager' || role === 'operations_manager' || role === 'call_center') {
            query += ` AND l.assigned_to = $${paramIndex}`;
            queryParams.push(managerId);
            paramIndex++;
        }
        
        query += ` ORDER BY l.created_at DESC`;
        
        const result = await db.query(query, queryParams);
        const leads = getRows(result);
        
        // إنشاء CSV
        const csvHeaders = ['ID', 'الاسم', 'الهاتف', 'المدينة', 'نوع العقار', 'قيمة الفاتورة', 'القدرة (kWp)', 'عدد الألواح', 'الحالة', 'تاريخ الإنشاء', 'الشركة'];
        const csvRows = leads.map(lead => [
            lead.id,
            lead.name,
            lead.phone,
            lead.city || '',
            lead.property_type,
            lead.bill_amount,
            lead.required_kw || '',
            lead.panels_count || '',
            lead.status,
            new Date(lead.created_at).toLocaleDateString('ar-TN'),
            lead.company_name || ''
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=leads_${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csvContent);
        
        console.log(`✅ Leads exported successfully by manager ${managerId}`);
        
    } catch (error) {
        console.error('❌ Error exporting leads:', error);
        res.status(500).json({ message: 'حدث خطأ في تصدير الطلبات', error: error.message });
    }
};