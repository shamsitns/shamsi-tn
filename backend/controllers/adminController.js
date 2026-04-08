const db = require('../config/database');
const { getDbType } = require('../config/database');
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
        const { status, page = 1, limit = 20, city } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Admin fetching leads - status: ${status}, page: ${page}`);
        
        let query = `
            SELECT l.*, 
                   u.name as created_by_name,
                   c.name as company_name
            FROM leads l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN companies c ON l.assigned_company_id = c.id
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
// إحصائيات متقدمة
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
        
        const stats = getFirstRow(resultStats) || {};
        
        // Leads by city
        const cityResult = await db.query(`
            SELECT city, COUNT(*) as count
            FROM leads
            WHERE city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        `);
        const byCity = getRows(cityResult);
        
        // Leads by property type
        const propertyResult = await db.query(`
            SELECT property_type, COUNT(*) as count
            FROM leads
            GROUP BY property_type
            ORDER BY count DESC
        `);
        const byProperty = getRows(propertyResult);
        
        // Monthly stats
        const dbType = getDbType();
        let monthlyQuery;
        
        if (dbType === 'postgres') {
            monthlyQuery = `
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                    COUNT(*) as count
                FROM leads
                WHERE created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
            `;
        } else {
            monthlyQuery = `
                SELECT 
                    strftime('%Y-%m', created_at) as month,
                    COUNT(*) as count
                FROM leads
                WHERE created_at >= datetime('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
            `;
        }
        
        const monthlyResult = await db.query(monthlyQuery);
        const byMonth = getRows(monthlyResult);
        
        res.json({
            ...stats,
            byCity: byCity || [],
            byProperty: byProperty || [],
            byMonth: byMonth || []
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
        
        res.json(users || []);
        
    } catch (error) {
        console.error('❌ Error getting users:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب المستخدمين', error: error.message });
    }
};

exports.addUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (getRows(existing).length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            `INSERT INTO users (name, email, password, role, phone, is_active) 
             VALUES ($1, $2, $3, $4, $5, true)`,
            [name, email, hashedPassword, role, phone || null]
        );
        
        res.status(201).json({ message: 'تم إضافة المستخدم بنجاح' });
        
    } catch (error) {
        console.error('❌ Error adding user:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة المستخدم', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, role, is_active } = req.body;
        
        await db.query(
            `UPDATE users 
             SET name = $1, phone = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $5`,
            [name, phone || null, role, is_active !== undefined ? is_active : true, id]
        );
        
        res.json({ message: 'تم تحديث المستخدم بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث المستخدم', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const leads = await db.query('SELECT COUNT(*) as count FROM leads WHERE created_by = $1', [id]);
        if (getRows(leads)[0]?.count > 0) {
            return res.status(400).json({ message: 'لا يمكن حذف المستخدم لأنه مرتبط بطلبات' });
        }
        
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'تم حذف المستخدم بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف المستخدم', error: error.message });
    }
};

// =============================================
// إدارة الطلبات (موافقة/رفض)
// =============================================
exports.approveLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user?.id;
        
        await db.query(
            `UPDATE leads 
             SET status = 'approved', 
                 approved_by = $1,
                 approved_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [adminId, leadId]
        );
        
        res.json({ message: 'تمت الموافقة على الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error approving lead:', error);
        res.status(500).json({ message: 'حدث خطأ في الموافقة', error: error.message });
    }
};

exports.rejectLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason } = req.body;
        
        await db.query(
            `UPDATE leads 
             SET status = 'cancelled', 
                 notes = COALESCE(notes, '') || '\n' || $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [`[${new Date().toISOString()}] تم الرفض: ${reason || 'لا يوجد سبب'}`, leadId]
        );
        
        res.json({ message: 'تم رفض الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error rejecting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في رفض الطلب', error: error.message });
    }
};

// =============================================
// تعيين الطلبات
// =============================================

// ✅ تعيين طلب للمدير التنفيذي (يستخدم ID المستلم من الواجهة)
exports.assignToExecutive = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { executiveId, notes } = req.body;  // استقبال ID من الواجهة
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to executive ${executiveId}`);
        
        if (!executiveId) {
            return res.status(400).json({ message: 'يرجى تحديد المدير التنفيذي' });
        }
        
        // التحقق من وجود المستخدم وصلاحية executive_manager
        const executiveResult = await db.query(
            "SELECT id, name FROM users WHERE id = $1 AND role = 'executive_manager' AND is_active = true",
            [executiveId]
        );
        const executive = getFirstRow(executiveResult);
        
        if (!executive) {
            return res.status(404).json({ message: 'المدير التنفيذي المحدد غير موجود' });
        }
        
        console.log(`✅ Found executive: ${executive.name} (ID: ${executive.id})`);
        
        // التحقق من وجود الطلب
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(leadResult);
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // تحديث الطلب: تغيير الحالة وتعيينه للمدير التنفيذي المختار
        await db.query(
            `UPDATE leads 
             SET status = 'contacted', 
                 assigned_to = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [executive.id, leadId]
        );
        
        console.log(`✅ Lead ${leadId} assigned to executive ${executive.name} (ID: ${executive.id})`);
        
        res.json({ 
            message: `تم إرسال الطلب للمدير التنفيذي: ${executive.name}`,
            leadId,
            executiveId: executive.id,
            executiveName: executive.name
        });
        
    } catch (error) {
        console.error('❌ Error assigning to executive:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// تعيين طلب لمركز الاتصال
exports.assignToCallCenter = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { callCenterId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to call center ${callCenterId}`);
        
        const callCenterResult = await db.query(
            'SELECT id, name FROM users WHERE id = $1 AND role = $2',
            [callCenterId, 'call_center']
        );
        const callCenter = getFirstRow(callCenterResult);
        
        if (!callCenter) {
            return res.status(404).json({ message: 'موظف مركز الاتصال غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'contacted', 
                 assigned_to = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [callCenterId, leadId]
        );
        
        console.log(`📝 Assignment recorded for lead ${leadId} to call center ${callCenter.name}`);
        
        res.json({ 
            message: `تم إرسال الطلب لمركز الاتصال: ${callCenter.name}`,
            leadId,
            callCenterId,
            callCenterName: callCenter.name
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// تعيين طلب لمدير البنك
exports.assignToBankManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { bankManagerId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to bank manager ${bankManagerId}`);
        
        const bankResult = await db.query(
            'SELECT id, name FROM users WHERE id = $1 AND role = $2',
            [bankManagerId, 'bank_manager']
        );
        const bankManager = getFirstRow(bankResult);
        
        if (!bankManager) {
            return res.status(404).json({ message: 'مدير البنك غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET financing_type = 'bank', 
                 assigned_to = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [bankManagerId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} assigned to bank manager ${bankManager.name}`);
        res.json({ 
            message: `تم إرسال الطلب لمدير البنك: ${bankManager.name}`,
            leadId,
            bankManagerId,
            bankManagerName: bankManager.name
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// تعيين طلب لمدير التأجير
exports.assignToLeasingManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { leasingManagerId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} assigning lead ${leadId} to leasing manager ${leasingManagerId}`);
        
        const leasingResult = await db.query(
            'SELECT id, name FROM users WHERE id = $1 AND role = $2',
            [leasingManagerId, 'leasing_manager']
        );
        const leasingManager = getFirstRow(leasingResult);
        
        if (!leasingManager) {
            return res.status(404).json({ message: 'مدير التأجير غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET financing_type = 'leasing', 
                 assigned_to = $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [leasingManagerId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} assigned to leasing manager ${leasingManager.name}`);
        res.json({ 
            message: `تم إرسال الطلب لمدير التأجير: ${leasingManager.name}`,
            leadId,
            leasingManagerId,
            leasingManagerName: leasingManager.name
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'حدث خطأ', error: error.message });
    }
};

// =============================================
// حذف الطلبات
// =============================================
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        
        await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM leads WHERE id = $1', [leadId]);
        
        res.json({ message: 'تم حذف الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب', error: error.message });
    }
};

// =============================================
// إدارة الشركات
// =============================================
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, address, contact_person, 
                   rating, projects_count, is_active, created_at
            FROM companies
            WHERE is_active = 1
            ORDER BY rating DESC
        `);
        
        res.json(getRows(result));
        
    } catch (error) {
        console.error('❌ Error getting companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات', error: error.message });
    }
};

// ✅ دالة addCompany (لا تنشئ مستخدم - المدير العام يضيف المستخدم يدوياً)
exports.addCompany = async (req, res) => {
    try {
        const { name, email, phone, address, contact_person, projects_count, description, website, logo } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
        }
        
        // التحقق من عدم وجود الشركة مسبقاً
        const existing = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        if (getRows(existing).length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        // ✅ إضافة الشركة فقط (بدون إنشاء مستخدم)
        const result = await db.query(`
            INSERT INTO companies (name, email, phone, address, contact_person, projects_count, description, website, logo, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
            RETURNING id
        `, [name, email, phone || null, address || null, contact_person || null, projects_count || 0, description || null, website || null, logo || null]);
        
        const companyId = result.rows[0].id;
        
        console.log(`✅ Company ${name} added successfully (ID: ${companyId})`);
        
        res.status(201).json({ 
            message: 'تم إضافة الشركة بنجاح',
            company: { id: companyId, name, email }
        });
        
    } catch (error) {
        console.error('❌ Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الشركة', error: error.message });
    }
};

exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, contact_person, rating, projects_count, is_active } = req.body;
        
        await db.query(`
            UPDATE companies 
            SET name = $1, phone = $2, address = $3, contact_person = $4,
                rating = $5, projects_count = $6, is_active = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
        `, [name, phone || null, address || null, contact_person || null, rating || 0, projects_count || 0, is_active !== undefined ? is_active : true, id]);
        
        res.json({ message: 'تم تحديث الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating company:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الشركة', error: error.message });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const leads = await db.query('SELECT COUNT(*) as count FROM lead_companies WHERE company_id = $1', [id]);
        if (getRows(leads)[0]?.count > 0) {
            return res.status(400).json({ message: 'لا يمكن حذف الشركة لأنها مرتبطة بطلبات' });
        }
        
        await db.query('DELETE FROM companies WHERE id = $1', [id]);
        res.json({ message: 'تم حذف الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting company:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الشركة', error: error.message });
    }
};

// =============================================
// إحصائيات العمولات
// =============================================
exports.getCommissionStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COALESCE(SUM(commission_amount), 0) as total_commission,
                COALESCE(SUM(commission_amount), 0) * 0.025 as zakat_amount
            FROM leads
            WHERE status = 'completed'
        `);
        
        const stats = getFirstRow(result) || { total_commission: 0, zakat_amount: 0 };
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting commission stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب إحصائيات العمولات', error: error.message });
    }
};

// =============================================
// جلب تفاصيل طلب محدد
// =============================================
exports.getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT l.*, 
                   u.name as created_by_name,
                   u2.name as approved_by_name,
                   u3.name as contacted_by_name,
                   c.name as company_name
            FROM leads l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN users u2 ON l.approved_by = u2.id
            LEFT JOIN users u3 ON l.contacted_by = u3.id
            LEFT JOIN companies c ON l.assigned_company_id = c.id
            WHERE l.id = $1
        `, [id]);
        
        const lead = getFirstRow(result);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        res.json(lead);
        
    } catch (error) {
        console.error('❌ Error getting lead by id:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلب', error: error.message });
    }
};