const db = require('../config/database');
const bcrypt = require('bcryptjs');

// =============================================
// إدارة الطلبات (لـ General Manager)
// =============================================

// الحصول على جميع الطلبات مع إحصائيات مفصلة
exports.getAllLeads = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, city, fromDate, toDate, assigned_to } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Admin fetching leads - status: ${status}, page: ${page}, city: ${city}`);
        
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
        const leads = result.rows || result;
        
        // الحصول على العدد الإجمالي
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
        const countResult = countResultRaw.rows || countResultRaw;
        
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

/// =============================================
// إحصائيات متقدمة (لـ General Manager)1
// =============================================
exports.getDashboardStats = async (req, res) => {
    try {
        console.log(`📈 Getting dashboard statistics`);
        
        const resultStats = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status = 'assigned_to_executive' THEN 1 ELSE 0 END) as assigned_to_executive,
                SUM(CASE WHEN status = 'assigned_to_call_center' THEN 1 ELSE 0 END) as assigned_to_call_center,
                SUM(CASE WHEN status = 'documents_received' THEN 1 ELSE 0 END) as documents_received,
                SUM(CASE WHEN status = 'devis_ready' THEN 1 ELSE 0 END) as devis_ready,
                SUM(CASE WHEN status = 'financing_pending' THEN 1 ELSE 0 END) as financing_pending,
                SUM(CASE WHEN status = 'financing_approved' THEN 1 ELSE 0 END) as financing_approved,
                SUM(CASE WHEN status = 'ready_for_installation' THEN 1 ELSE 0 END) as ready_for_installation,
                SUM(CASE WHEN status = 'installation_completed' THEN 1 ELSE 0 END) as installation_completed,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                COALESCE(SUM(commission), 0) as total_commission,
                COALESCE(SUM(estimated_price), 0) as total_value,
                COALESCE(SUM(required_kw), 0) as total_kw   // <--- تغيير هنا
            FROM leads
        `);
        const stats = resultStats.rows || resultStats;
        
        const resultCityStats = await db.query(`
            SELECT city, COUNT(*) as count, COALESCE(SUM(commission), 0) as commission
            FROM leads
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        `);
        const cityStats = resultCityStats.rows || resultCityStats;
        
        const resultPaymentStats = await db.query(`
            SELECT payment_method, COUNT(*) as count, COALESCE(SUM(commission), 0) as commission
            FROM leads
            GROUP BY payment_method
            ORDER BY count DESC
        `);
        const paymentStats = resultPaymentStats.rows || resultPaymentStats;
        
        const resultPropertyStats = await db.query(`
            SELECT property_type, COUNT(*) as count, COALESCE(SUM(commission), 0) as commission
            FROM leads
            GROUP BY property_type
            ORDER BY count DESC
        `);
        const propertyStats = resultPropertyStats.rows || resultPropertyStats;
        
        const resultMonthlyStats = await db.query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as count,
                COALESCE(SUM(commission), 0) as commission
            FROM leads
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
        `);
        const monthlyStats = resultMonthlyStats.rows || resultMonthlyStats;
        
        const result = stats[0] || { 
            total: 0, new: 0, assigned_to_executive: 0, assigned_to_call_center: 0,
            documents_received: 0, devis_ready: 0, financing_pending: 0,
            financing_approved: 0, ready_for_installation: 0, installation_completed: 0,
            completed: 0, rejected: 0, total_commission: 0, total_value: 0, total_kw: 0
        };
        
        console.log(`📊 Stats: total=${result.total}, commission=${result.total_commission}`);
        
        res.json({
            ...result,
            byCity: cityStats || [],
            byPayment: paymentStats || [],
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
        const users = result.rows || result;
        
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
        const existing = resultExisting.rows || resultExisting;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
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
        const leads = resultLeads.rows || resultLeads;
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
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'approved_by_admin', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [leadId]
        );
        
        console.log(`✅ Lead ${leadId} approved`);
        res.json({ 
            message: 'تمت الموافقة على الطلب بنجاح',
            leadId,
            status: 'approved_by_admin'
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
        
        console.log(`❌ Admin ${adminId} rejecting lead ${leadId}, reason: ${reason}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'rejected', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [leadId]
        );
        
        await db.query(
            `INSERT INTO lead_rejections (lead_id, rejected_by, reason, rejected_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [leadId, adminId, reason || 'لا يوجد سبب']
        );
        
        console.log(`✅ Lead ${leadId} rejected`);
        res.json({ 
            message: 'تم رفض الطلب بنجاح',
            leadId,
            status: 'rejected'
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
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultExecutive = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [executiveId, 'executive_manager']);
        const executives = resultExecutive.rows || resultExecutive;
        if (!executives || executives.length === 0) {
            return res.status(404).json({ message: 'المدير التنفيذي غير موجود' });
        }
        
        const executive = executives[0];
        
        await db.query(
            `UPDATE leads 
             SET status = 'assigned_to_executive', 
                 assigned_to = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [executiveId, leadId]
        );
        
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes, status) 
             VALUES ($1, $2, $3, $4, 'pending')`,
            [leadId, executiveId, adminId, notes || `تم إرسال الطلب من قبل المدير العام`]
        );
        
        console.log(`✅ Lead ${leadId} assigned to executive ${executive.name}`);
        res.json({ 
            message: `تم إرسال الطلب للمدير التنفيذي: ${executive.name}`,
            leadId,
            executiveId,
            executiveName: executive.name
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
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const resultCallCenter = await db.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [callCenterId, 'call_center']);
        const callCenters = resultCallCenter.rows || resultCallCenter;
        if (!callCenters || callCenters.length === 0) {
            return res.status(404).json({ message: 'موظف مركز الاتصال غير موجود' });
        }
        
        const callCenter = callCenters[0];
        
        await db.query(
            `UPDATE leads 
             SET status = 'assigned_to_call_center', 
                 assigned_to = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [callCenterId, leadId]
        );
        
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes, status) 
             VALUES ($1, $2, $3, $4, 'pending')`,
            [leadId, callCenterId, adminId, notes || `تم إرسال الطلب من قبل المدير العام`]
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
// إحصائيات العمولات والزكاة (لـ Owner)
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
                COALESCE(SUM(commission), 0) as total_commission,
                COALESCE(SUM(commission), 0) * 0.025 as zakat_amount
            FROM leads
            WHERE status = 'completed' OR status = 'installation_completed'
            ${dateFilter}
        `, params);
        
        const commissionData = resultCommission.rows?.[0] || { total_commission: 0, zakat_amount: 0 };
        
        const resultMonthly = await db.query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COALESCE(SUM(commission), 0) as monthly_commission,
                COALESCE(SUM(commission), 0) * 0.025 as monthly_zakat
            FROM leads
            WHERE (status = 'completed' OR status = 'installation_completed')
                ${dateFilter}
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        const monthlyStats = resultMonthly.rows || resultMonthly;
        
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

// =============================================
// حذف الطلبات
// =============================================

// حذف طلب فردي
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM lead_rejections WHERE lead_id = $1', [leadId]);
        await db.query('DELETE FROM leads WHERE id = $1', [leadId]);
        
        console.log(`✅ Lead ${leadId} deleted`);
        res.json({ message: 'تم حذف الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب', error: error.message });
    }
};

// حذف جميع الطلبات
exports.deleteAllLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting ALL leads`);
        
        await db.query('DELETE FROM lead_companies');
        await db.query('DELETE FROM manager_assignments');
        await db.query('DELETE FROM lead_rejections');
        await db.query('DELETE FROM leads');
        await db.query('SELECT setval(\'leads_id_seq\', 1, false)');
        
        console.log(`✅ All leads deleted`);
        res.json({ message: 'تم حذف جميع الطلبات بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting all leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات', error: error.message });
    }
};

// حذف الطلبات المرفوضة فقط
exports.deleteRejectedLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting rejected leads`);
        
        const rejectedLeads = await db.query('SELECT id FROM leads WHERE status = $1', ['rejected']);
        const leadIds = rejectedLeads.rows || rejectedLeads;
        
        if (leadIds.length > 0) {
            for (const lead of leadIds) {
                await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [lead.id]);
                await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [lead.id]);
                await db.query('DELETE FROM lead_rejections WHERE lead_id = $1', [lead.id]);
            }
            await db.query('DELETE FROM leads WHERE status = $1', ['rejected']);
        }
        
        console.log(`✅ ${leadIds.length} rejected leads deleted`);
        res.json({ 
            message: `تم حذف ${leadIds.length} طلب مرفوض بنجاح`,
            deletedCount: leadIds.length
        });
        
    } catch (error) {
        console.error('❌ Error deleting rejected leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات المرفوضة', error: error.message });
    // =============================================
// إدارة الشركات (للمدير العام)
// =============================================

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, city, description, rating, projects_count, logo, is_active, created_at
            FROM companies
            ORDER BY rating DESC, projects_count DESC
        `);
        const companies = result.rows || result;
        
        res.json(companies || []);
        
    } catch (error) {
        console.error('❌ Error getting companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات' });
    }
};

// إضافة شركة جديدة
exports.addCompany = async (req, res) => {
    try {
        const { name, email, password, phone, city, description, rating, projects_count, logo } = req.body;
        
        console.log(`🏢 Adding new company: ${name}, ${email}`);
        
        // التحقق من وجود البريد
        const resultExisting = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        const existing = resultExisting.rows || resultExisting;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await db.query(
            `INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count, logo, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
            [name, email, hashedPassword, phone || null, city || null, description || null, rating || 0, projects_count || 0, logo || null]
        );
        
        console.log(`✅ Company ${name} added successfully`);
        res.status(201).json({ 
            message: 'تم إضافة الشركة بنجاح',
            company: { name, email }
        });
        
    } catch (error) {
        console.error('❌ Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الشركة' });
    }
};

// تحديث شركة
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, city, description, rating, projects_count, logo, is_active } = req.body;
        
        console.log(`🏢 Updating company ${id}`);
        
        await db.query(
            `UPDATE companies 
             SET name = $1, phone = $2, city = $3, description = $4, 
                 rating = $5, projects_count = $6, logo = $7, is_active = $8,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $9`,
            [name, phone || null, city || null, description || null, rating || 0, projects_count || 0, logo || null, is_active !== undefined ? is_active : 1, id]
        );
        
        console.log(`✅ Company ${id} updated`);
        res.json({ message: 'تم تحديث الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating company:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الشركة' });
    }
};

// حذف شركة
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🏢 Deleting company ${id}`);
        
        // التحقق من وجود طلبات مرتبطة
        const resultLeads = await db.query('SELECT COUNT(*) as count FROM lead_companies WHERE company_id = $1', [id]);
        const leads = resultLeads.rows || resultLeads;
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
        res.status(500).json({ message: 'حدث خطأ في حذف الشركة' });
    }
};}
};