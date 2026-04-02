const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// إدارة الطلبات (لـ General Manager)
// =============================================

// الحصول على جميع الطلبات
exports.getAllLeads = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, city, fromDate, toDate, assigned_to } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Admin fetching leads - status: ${status}, page: ${page}`);
        
        let query = `
            SELECT l.*, 
                   u.name as assigned_to_name,
                   u.role as assigned_role
            FROM leads l
            LEFT JOIN users u ON l.assigned_to = u.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;
        
        if (status && status !== 'all') {
            query += ` AND l.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        
        if (city) {
            query += ` AND l.city = $${paramIndex}`;
            queryParams.push(city);
            paramIndex++;
        }
        
        if (fromDate) {
            query += ` AND DATE(l.created_at) >= $${paramIndex}`;
            queryParams.push(fromDate);
            paramIndex++;
        }
        
        if (toDate) {
            query += ` AND DATE(l.created_at) <= $${paramIndex}`;
            queryParams.push(toDate);
            paramIndex++;
        }
        
        if (assigned_to) {
            query += ` AND l.assigned_to = $${paramIndex}`;
            queryParams.push(assigned_to);
            paramIndex++;
        }
        
        query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = getRows(result);
        
        let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
        const countParams = [];
        let countIndex = 1;
        
        if (status && status !== 'all') {
            countQuery += ` AND status = $${countIndex}`;
            countParams.push(status);
            countIndex++;
        }
        
        if (city) {
            countQuery += ` AND city = $${countIndex}`;
            countParams.push(city);
            countIndex++;
        }
        
        if (assigned_to) {
            countQuery += ` AND assigned_to = $${countIndex}`;
            countParams.push(assigned_to);
            countIndex++;
        }
        
        const countResultRaw = await db.query(countQuery, countParams);
        const countResult = getRows(countResultRaw);
        
        console.log(`✅ Found ${leads?.length || 0} leads, total: ${countResult[0]?.total || 0}`);
        
        res.json({
            leads: leads || [],
            total: countResult[0]?.total || 0,
            page: parseInt(page),
            totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلبات', error: error.message });
    }
};

// =============================================
// إحصائيات متقدمة (مع العمولة)
// =============================================
exports.getDashboardStats = async (req, res) => {
    try {
        console.log(`📈 Getting dashboard statistics`);
        
        const resultStats = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status = 'sent_to_operations' THEN 1 ELSE 0 END) as sent_to_operations,
                SUM(CASE WHEN status = 'assigned_to_company' THEN 1 ELSE 0 END) as assigned_to_company,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                COALESCE(SUM(commission_amount), 0) as total_commission,
                COALESCE(SUM(required_kw), 0) as total_kw
            FROM leads
        `);
        
        const stats = getFirstRow(resultStats) || { 
            total: 0, pending: 0, approved: 0, contacted: 0,
            sent_to_operations: 0, assigned_to_company: 0,
            completed: 0, cancelled: 0, total_commission: 0, total_kw: 0
        };
        
        const resultCityStats = await db.query(`
            SELECT city, COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as commission
            FROM leads
            WHERE city IS NOT NULL
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        `);
        const cityStats = getRows(resultCityStats);
        
        const resultPropertyStats = await db.query(`
            SELECT property_type, COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as commission
            FROM leads
            GROUP BY property_type
            ORDER BY count DESC
        `);
        const propertyStats = getRows(resultPropertyStats);
        
        const resultMonthlyStats = await db.query(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count,
                COALESCE(SUM(commission_amount), 0) as commission
            FROM leads
            WHERE created_at >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
        `);
        const monthlyStats = getRows(resultMonthlyStats);
        
        console.log(`📊 Stats: total=${stats.total}, commission=${stats.total_commission}`);
        
        res.json({
            ...stats,
            byCity: cityStats || [],
            byProperty: propertyStats || [],
            byMonth: monthlyStats || []
        });
        
    } catch (error) {
        console.error('❌ Error getting dashboard stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// إدارة المستخدمين
// =============================================
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        
        let query = 'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (role) {
            query += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await db.query(query, params);
        const users = getRows(result);
        
        console.log(`👥 Found ${users?.length || 0} users`);
        res.json(users || []);
        
    } catch (error) {
        console.error('❌ Error getting users:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب المستخدمين', error: error.message });
    }
};

exports.addUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        
        console.log(`👥 Adding new user: ${name}, ${email}, role: ${role}`);
        
        const resultExisting = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        const existing = getRows(resultExisting);
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            `INSERT INTO users (name, email, password, role, phone, is_active) 
             VALUES ($1, $2, $3, $4, $5, true)`,
            [name, email, hashedPassword, role, phone || null]
        );
        
        console.log(`✅ User ${name} added successfully`);
        res.status(201).json({ 
            message: 'تم إضافة المستخدم بنجاح',
            user: { name, email, role }
        });
        
    } catch (error) {
        console.error('❌ Error adding user:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة المستخدم', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, role, is_active } = req.body;
        
        console.log(`👥 Updating user ${id}`);
        
        await db.query(
            `UPDATE users 
             SET name = $1, phone = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $5`,
            [name, phone || null, role, is_active !== undefined ? is_active : true, id]
        );
        
        console.log(`✅ User ${id} updated`);
        res.json({ message: 'تم تحديث المستخدم بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث المستخدم', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`👥 Deleting user ${id}`);
        
        const resultLeads = await db.query('SELECT COUNT(*) as count FROM leads WHERE assigned_to = $1', [id]);
        const leads = getRows(resultLeads);
        if (leads[0]?.count > 0) {
            return res.status(400).json({ 
                message: `لا يمكن حذف المستخدم لأن لديه ${leads[0].count} طلبات مرتبطة`,
                hasLeads: true
            });
        }
        
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        
        console.log(`✅ User ${id} deleted`);
        res.json({ message: 'تم حذف المستخدم بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف المستخدم', error: error.message });
    }
};

// =============================================
// إدارة الطلبات (موافقة/رفض/تعيين)
// =============================================
exports.approveLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user.id;
        
        console.log(`✅ Admin ${adminId} approving lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'approved', 
                 approved_by = $1,
                 approved_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [adminId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} approved`);
        res.json({ 
            message: 'تمت الموافقة على الطلب بنجاح',
            leadId,
            status: 'approved'
        });
        
    } catch (error) {
        console.error('❌ Error approving lead:', error);
        res.status(500).json({ message: 'حدث خطأ في الموافقة على الطلب', error: error.message });
    }
};

exports.rejectLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;
        
        console.log(`❌ Admin ${adminId} rejecting lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'cancelled', 
                 notes = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [reason || 'تم رفض الطلب من قبل المدير العام', leadId]
        );
        
        await db.query(
            `INSERT INTO activity_logs (user_id, action, details) 
             VALUES ($1, $2, $3)`,
            [adminId, 'lead_rejected', `تم رفض الطلب رقم ${leadId}: ${reason || 'لا يوجد سبب'}`]
        );
        
        console.log(`✅ Lead ${leadId} rejected`);
        res.json({ 
            message: 'تم رفض الطلب بنجاح',
            leadId,
            status: 'cancelled'
        });
        
    } catch (error) {
        console.error('❌ Error rejecting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في رفض الطلب', error: error.message });
    }
};

exports.assignToExecutive = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { executiveId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to executive ${executiveId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        const lead = leads[0];
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultExecutive = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [executiveId, 'executive_manager']);
        const executives = getRows(resultExecutive);
        if (!executives || executives.length === 0) {
            return res.status(404).json({ message: 'المدير التنفيذي غير موجود' });
        }
        
        const executive = executives[0];
        
        // تجميع جميع المعلومات لنقلها للمدير التنفيذي
        const assignmentNotes = `
📋 معلومات الطلب الكاملة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 معلومات العميل:
   • الاسم: ${lead.name}
   • الهاتف: ${lead.phone}
   • البريد الإلكتروني: ${lead.email || 'غير مدخل'}
   • المدينة: ${lead.city || 'غير مدخلة'}

🏠 معلومات العقار:
   • نوع العقار: ${lead.property_type === 'house' ? 'منزل' : 
                   lead.property_type === 'apartment' ? 'شقة' :
                   lead.property_type === 'farm' ? 'مزرعة' :
                   lead.property_type === 'commercial' ? 'محل تجاري' : 'مصنع'}
   • توفر السطح: ${lead.roof_availability ? 'متوفر' : 'غير متوفر'}

⚡ معلومات الكهرباء:
   • قيمة الفاتورة: ${lead.bill_amount} دينار
   • فترة الفاتورة: ${lead.bill_period_months === 60 ? 'شهرين' : 'شهر'}
   • موسم الفاتورة: ${lead.bill_season === 'spring' ? 'الربيع' :
                     lead.bill_season === 'summer' ? 'الصيف' :
                     lead.bill_season === 'autumn' ? 'الخريف' : 'الشتاء'}

☀️ نتائج الدراسة:
   • القدرة المطلوبة: ${lead.required_kw} kWp
   • عدد الألواح: ${lead.panels_count}
   • العمولة: ${lead.commission_amount} دينار

📝 معلومات إضافية:
${lead.additional_info || 'لا توجد معلومات إضافية'}

${notes ? `\n📌 ملاحظات المدير العام:\n${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        await db.query(
            `UPDATE leads 
             SET status = 'contacted', 
                 assigned_to = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [executiveId, leadId]
        );
        
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes) 
             VALUES ($1, $2, $3, $4)`,
            [leadId, executiveId, adminId, assignmentNotes]
        );
        
        console.log(`✅ Lead ${leadId} assigned to executive ${executive.name}`);
        res.json({ 
            message: `تم إرسال الطلب للمدير التنفيذي: ${executive.name}`,
            leadId,
            executiveId,
            executiveName: executive.name,
            leadInfo: {
                name: lead.name,
                phone: lead.phone,
                city: lead.city,
                property_type: lead.property_type,
                bill_amount: lead.bill_amount,
                required_kw: lead.required_kw,
                panels_count: lead.panels_count,
                commission_amount: lead.commission_amount,
                additional_info: lead.additional_info
            }
        });
        
    } catch (error) {
        console.error('❌ Error assigning to executive:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب للمدير التنفيذي', error: error.message });
    }
};

exports.assignToCallCenter = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { callCenterId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to call center ${callCenterId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        const lead = leads[0];
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultCallCenter = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [callCenterId, 'call_center']);
        const callCenters = getRows(resultCallCenter);
        if (!callCenters || callCenters.length === 0) {
            return res.status(404).json({ message: 'موظف مركز الاتصال غير موجود' });
        }
        
        const callCenter = callCenters[0];
        
        const assignmentNotes = `
📋 معلومات الطلب الكاملة:
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

📝 معلومات إضافية:
${lead.additional_info || 'لا توجد معلومات إضافية'}

${notes ? `\n📌 ملاحظات المدير العام:\n${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        await db.query(
            `UPDATE leads 
             SET status = 'contacted', 
                 assigned_to = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [callCenterId, leadId]
        );
        
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes) 
             VALUES ($1, $2, $3, $4)`,
            [leadId, callCenterId, adminId, assignmentNotes]
        );
        
        console.log(`✅ Lead ${leadId} assigned to call center ${callCenter.name}`);
        res.json({ 
            message: `تم إرسال الطلب لمركز الاتصال: ${callCenter.name}`,
            leadId,
            callCenterId,
            callCenterName: callCenter.name
        });
        
    } catch (error) {
        console.error('❌ Error assigning to call center:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمركز الاتصال', error: error.message });
    }
};

// =============================================
// تعيين طلب لمدير بنك
// =============================================
exports.assignToBankManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { bankManagerId, bankId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to bank manager ${bankManagerId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        const lead = leads[0];
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultManager = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [bankManagerId, 'bank_manager']);
        const managers = getRows(resultManager);
        if (!managers || managers.length === 0) {
            return res.status(404).json({ message: 'مدير البنك غير موجود' });
        }
        
        const manager = managers[0];
        
        await db.query(
            `UPDATE leads 
             SET status = 'financing_pending', 
                 financing_type = 'bank',
                 preferred_bank_id = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [bankId || null, leadId]
        );
        
        await db.query(
            `INSERT INTO financing_requests (lead_id, financing_type, bank_id, assigned_to, notes, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [leadId, 'bank', bankId || null, bankManagerId, notes || `تم إرسال الطلب من قبل المدير العام`]
        );
        
        console.log(`✅ Lead ${leadId} assigned to bank manager ${manager.name}`);
        res.json({ 
            message: `تم إرسال الطلب لمدير البنك: ${manager.name}`,
            leadId,
            bankManagerId,
            bankManagerName: manager.name
        });
        
    } catch (error) {
        console.error('❌ Error assigning to bank manager:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير البنك', error: error.message });
    }
};

// =============================================
// تعيين طلب لمدير تأجير
// =============================================
exports.assignToLeasingManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { leasingManagerId, leasingCompanyId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to leasing manager ${leasingManagerId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        const lead = leads[0];
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultManager = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [leasingManagerId, 'leasing_manager']);
        const managers = getRows(resultManager);
        if (!managers || managers.length === 0) {
            return res.status(404).json({ message: 'مدير التأجير غير موجود' });
        }
        
        const manager = managers[0];
        
        await db.query(
            `UPDATE leads 
             SET status = 'financing_pending', 
                 financing_type = 'leasing',
                 leasing_id = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [leasingCompanyId || null, leadId]
        );
        
        await db.query(
            `INSERT INTO financing_requests (lead_id, financing_type, leasing_id, assigned_to, notes, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [leadId, 'leasing', leasingCompanyId || null, leasingManagerId, notes || `تم إرسال الطلب من قبل المدير العام`]
        );
        
        console.log(`✅ Lead ${leadId} assigned to leasing manager ${manager.name}`);
        res.json({ 
            message: `تم إرسال الطلب لمدير التأجير: ${manager.name}`,
            leadId,
            leasingManagerId,
            leasingManagerName: manager.name
        });
        
    } catch (error) {
        console.error('❌ Error assigning to leasing manager:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير التأجير', error: error.message });
    }
};

// =============================================
// حذف الطلبات
// =============================================
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM leads WHERE id = $1', [leadId]);
        
        console.log(`✅ Lead ${leadId} deleted`);
        res.json({ message: 'تم حذف الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب', error: error.message });
    }
};

exports.deleteAllLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting ALL leads`);
        
        await db.query('DELETE FROM lead_companies');
        await db.query('DELETE FROM manager_assignments');
        await db.query('DELETE FROM leads');
        
        console.log(`✅ All leads deleted`);
        res.json({ message: 'تم حذف جميع الطلبات بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting all leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات', error: error.message });
    }
};

exports.deleteRejectedLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting cancelled leads`);
        
        const rejectedLeads = await db.query('SELECT id FROM leads WHERE status = $1', ['cancelled']);
        const leadIds = getRows(rejectedLeads);
        
        if (leadIds.length > 0) {
            for (const lead of leadIds) {
                await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [lead.id]);
                await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [lead.id]);
            }
            await db.query('DELETE FROM leads WHERE status = $1', ['cancelled']);
        }
        
        console.log(`✅ ${leadIds.length} cancelled leads deleted`);
        res.json({ 
            message: `تم حذف ${leadIds.length} طلب ملغي بنجاح`,
            deletedCount: leadIds.length
        });
        
    } catch (error) {
        console.error('❌ Error deleting cancelled leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات الملغية', error: error.message });
    }
};

// =============================================
// إدارة الشركات (نسخة متكاملة)
// =============================================

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, address, contact_person, 
                   description, rating, projects_count, established_year,
                   license_number, website, logo, cover_image, is_active, created_at
            FROM companies
            WHERE is_active = 1
            ORDER BY rating DESC, projects_count DESC
        `);
        const companies = getRows(result);
        
        console.log(`🏢 Found ${companies?.length || 0} companies`);
        res.json(companies || []);
        
    } catch (error) {
        console.error('❌ Error getting companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات', error: error.message });
    }
};

// الحصول على شركة محددة
exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT id, name, email, phone, address, contact_person,
                   description, rating, projects_count, established_year,
                   license_number, website, logo, cover_image, is_active, created_at
            FROM companies
            WHERE id = $1 AND is_active = 1
        `, [id]);
        
        const company = getFirstRow(result);
        
        if (!company) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        res.json(company);
        
    } catch (error) {
        console.error('❌ Error getting company:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركة', error: error.message });
    }
};

// إضافة شركة جديدة
exports.addCompany = async (req, res) => {
    try {
        const { 
            name, email, phone, address, contact_person,
            description, rating, projects_count, established_year,
            license_number, website, logo, cover_image
        } = req.body;
        
        console.log(`🏢 Adding new company: ${name}, ${email}, projects: ${projects_count}`);
        
        if (!name || !email) {
            return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
        }
        
        const resultExisting = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        const existing = getRows(resultExisting);
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        await db.query(`
            INSERT INTO companies (
                name, email, phone, address, contact_person,
                description, rating, projects_count, established_year,
                license_number, website, logo, cover_image, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, CURRENT_TIMESTAMP)
        `, [
            name, email, phone || null, address || null, contact_person || null,
            description || null, rating || 0, projects_count || 0, established_year || null,
            license_number || null, website || null, logo || null, cover_image || null
        ]);
        
        console.log(`✅ Company ${name} added successfully with ${projects_count} projects`);
        res.status(201).json({ 
            message: 'تم إضافة الشركة بنجاح',
            company: { name, email, projects_count }
        });
        
    } catch (error) {
        console.error('❌ Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الشركة', error: error.message });
    }
};

// تحديث شركة
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, phone, address, contact_person,
            description, rating, projects_count, established_year,
            license_number, website, logo, cover_image, is_active
        } = req.body;
        
        console.log(`🏢 Updating company ${id}, projects: ${projects_count}`);
        
        const existingResult = await db.query('SELECT id FROM companies WHERE id = $1', [id]);
        const existing = getRows(existingResult);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        await db.query(`
            UPDATE companies 
            SET name = $1, phone = $2, address = $3, contact_person = $4,
                description = $5, rating = $6, projects_count = $7, 
                established_year = $8, license_number = $9, website = $10,
                logo = $11, cover_image = $12, is_active = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
        `, [
            name, phone || null, address || null, contact_person || null,
            description || null, rating || 0, projects_count || 0, established_year || null,
            license_number || null, website || null, logo || null, cover_image || null,
            is_active !== undefined ? is_active : true, id
        ]);
        
        console.log(`✅ Company ${id} updated with ${projects_count} projects`);
        res.json({ message: 'تم تحديث الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating company:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الشركة', error: error.message });
    }
};

// حذف شركة
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🏢 Deleting company ${id}`);
        
        const resultLeads = await db.query('SELECT COUNT(*) as count FROM lead_companies WHERE company_id = $1', [id]);
        const leads = getRows(resultLeads);
        if (leads[0]?.count > 0) {
            return res.status(400).json({ 
                message: `لا يمكن حذف الشركة لأن لديها ${leads[0].count} طلبات مرتبطة`,
                hasLeads: true
            });
        }
        
        await db.query('DELETE FROM companies WHERE id = $1', [id]);
        
        console.log(`✅ Company ${id} deleted`);
        res.json({ message: 'تم حذف الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting company:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الشركة', error: error.message });
    }
};

// رفع صورة الشركة
exports.uploadCompanyImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageType, imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ message: 'رابط الصورة مطلوب' });
        }
        
        if (imageType !== 'logo' && imageType !== 'cover_image') {
            return res.status(400).json({ message: 'نوع الصورة غير صالح' });
        }
        
        await db.query(`
            UPDATE companies 
            SET ${imageType} = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [imageUrl, id]);
        
        console.log(`✅ Company ${id} ${imageType} updated`);
        res.json({ message: 'تم تحديث الصورة بنجاح', imageUrl });
        
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ message: 'حدث خطأ في رفع الصورة', error: error.message });
    }
};

// =============================================
// إحصائيات العمولات والزكاة
// =============================================
exports.getCommissionStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        const params = [];
        let paramIndex = 1;
        
        if (startDate) {
            dateFilter += ` AND created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        
        if (endDate) {
            dateFilter += ` AND created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }
        
        const resultCommission = await db.query(`
            SELECT 
                COALESCE(SUM(commission_amount), 0) as total_commission,
                COALESCE(SUM(commission_amount), 0) * 0.025 as zakat_amount
            FROM leads
            WHERE status = 'completed'
            ${dateFilter}
        `, params);
        
        const commissionData = getFirstRow(resultCommission) || { total_commission: 0, zakat_amount: 0 };
        
        const resultMonthly = await db.query(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COALESCE(SUM(commission_amount), 0) as monthly_commission,
                COALESCE(SUM(commission_amount), 0) * 0.025 as monthly_zakat
            FROM leads
            WHERE status = 'completed'
                ${dateFilter}
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        const monthlyStats = getRows(resultMonthly);
        
        res.json({
            total_commission: commissionData.total_commission,
            zakat_amount: commissionData.zakat_amount,
            monthly: monthlyStats
        });
        
    } catch (error) {
        console.error('❌ Error getting commission stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب إحصائيات العمولات', error: error.message });
    }
};