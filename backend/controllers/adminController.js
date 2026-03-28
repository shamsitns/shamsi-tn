const db = require('../config/database');
const bcrypt = require('bcryptjs');

// =============================================
// إدارة الطلبات
// =============================================

// الحصول على جميع الطلبات
exports.getAllLeads = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, city, fromDate, toDate } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Admin fetching leads - status: ${status}, page: ${page}, city: ${city}`);
        
        let query = `
            SELECT l.*, 
                   m.name as manager_name,
                   c.name as company_name,
                   c.rating as company_rating
            FROM leads l
            LEFT JOIN managers m ON l.manager_id = m.id
            LEFT JOIN companies c ON l.company_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];
        
        if (status && status !== 'all') {
            query += ' AND l.status = ?';
            queryParams.push(status);
        }
        
        if (city) {
            query += ' AND l.city = ?';
            queryParams.push(city);
        }
        
        if (fromDate) {
            query += ' AND DATE(l.created_at) >= ?';
            queryParams.push(fromDate);
        }
        
        if (toDate) {
            query += ' AND DATE(l.created_at) <= ?';
            queryParams.push(toDate);
        }
        
        query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = result.rows || result;
        
        // الحصول على العدد الإجمالي
        let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
        const countParams = [];
        
        if (status && status !== 'all') {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        
        if (city) {
            countQuery += ' AND city = ?';
            countParams.push(city);
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

// الموافقة على طلب
exports.approveLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user.id;
        
        console.log(`✅ Admin ${adminId} approving lead ${leadId}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = ?', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // تحديث حالة الطلب
        await db.execute(
            `UPDATE leads 
             SET status = 'approved_by_admin', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
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

// رفض طلب
exports.rejectLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;
        
        console.log(`❌ Admin ${adminId} rejecting lead ${leadId}, reason: ${reason}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = ?', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // تحديث حالة الطلب
        await db.execute(
            `UPDATE leads 
             SET status = 'rejected', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [leadId]
        );
        
        // تسجيل سبب الرفض في جدول منفصل (اختياري)
        await db.execute(
            `INSERT INTO lead_rejections (lead_id, rejected_by, reason, rejected_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
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

// إرسال طلب لمدير
exports.sendToManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { managerId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} sending lead ${leadId} to manager ${managerId}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = ?', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // التحقق من وجود المدير
        const resultManager = await db.query(
            'SELECT id, name FROM managers WHERE id = ?',
            [managerId]
        );
        const managers = resultManager.rows || resultManager;
        if (!managers || managers.length === 0) {
            return res.status(404).json({ message: 'المدير غير موجود' });
        }
        
        const manager = managers[0];
        
        // تحديث lead
        await db.execute(
            `UPDATE leads 
             SET status = 'sent_to_manager', 
                 manager_id = ?, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [managerId, leadId]
        );
        
        // إضافة تعيين في manager_assignments
        const resultExisting = await db.query(
            `SELECT id FROM manager_assignments 
             WHERE lead_id = ? AND manager_id = ?`,
            [leadId, managerId]
        );
        const existing = resultExisting.rows || resultExisting;
        
        if (existing && existing.length > 0) {
            await db.execute(
                `UPDATE manager_assignments 
                 SET assigned_by = ?, notes = ?, status = 'pending', assigned_at = CURRENT_TIMESTAMP
                 WHERE lead_id = ? AND manager_id = ?`,
                [adminId, notes || `تم إرسال الطلب من قبل الأدمن`, leadId, managerId]
            );
        } else {
            await db.execute(
                `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes, status) 
                 VALUES (?, ?, ?, ?, ?)`,
                [leadId, managerId, adminId, notes || `تم إرسال الطلب من قبل الأدمن`, 'pending']
            );
        }
        
        console.log(`✅ Lead ${leadId} sent to manager ${manager.name}`);
        res.json({ 
            message: `تم إرسال الطلب للمدير: ${manager.name}`,
            leadId,
            managerId,
            managerName: manager.name
        });
        
    } catch (error) {
        console.error('❌ Error sending to manager:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب للمدير', error: error.message });
    }
};

// =============================================
// إدارة المديرين
// =============================================

// الحصول على جميع المديرين
exports.getAllManagers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, company_name, city, 
                   (SELECT COUNT(*) FROM leads WHERE manager_id = managers.id) as assigned_leads_count,
                   (SELECT COUNT(*) FROM leads WHERE manager_id = managers.id AND status = 'completed') as completed_leads_count,
                   created_at
            FROM managers 
            ORDER BY created_at DESC
        `);
        const managers = result.rows || result;
        
        console.log(`👥 Found ${managers?.length || 0} managers`);
        res.json(managers || []);
        
    } catch (error) {
        console.error('❌ Error getting managers:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب المديرين', error: error.message });
    }
};

// إضافة مدير جديد
exports.addManager = async (req, res) => {
    try {
        const { name, email, password, phone, company_name, city } = req.body;
        
        console.log(`👥 Adding new manager: ${name}, ${email}`);
        
        // التحقق من وجود البريد
        const resultExisting = await db.query('SELECT id FROM managers WHERE email = ?', [email]);
        const existing = resultExisting.rows || resultExisting;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await db.execute(
            `INSERT INTO managers (name, email, password, phone, company_name, city) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone || null, company_name || null, city || null]
        );
        
        console.log(`✅ Manager ${name} added successfully`);
        res.status(201).json({ 
            message: 'تم إضافة المدير بنجاح',
            manager: { name, email }
        });
        
    } catch (error) {
        console.error('❌ Error adding manager:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة المدير', error: error.message });
    }
};

// تحديث مدير
exports.updateManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, company_name, city, is_active } = req.body;
        
        console.log(`👥 Updating manager ${id}`);
        
        await db.execute(
            `UPDATE managers 
             SET name = ?, phone = ?, company_name = ?, city = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [name, phone || null, company_name || null, city || null, id]
        );
        
        console.log(`✅ Manager ${id} updated`);
        res.json({ message: 'تم تحديث المدير بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating manager:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث المدير', error: error.message });
    }
};

// حذف مدير
exports.deleteManager = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`👥 Deleting manager ${id}`);
        
        // التحقق من وجود طلبات مرتبطة
        const resultLeads = await db.query('SELECT COUNT(*) as count FROM leads WHERE manager_id = ?', [id]);
        const leads = resultLeads.rows || resultLeads;
        if (leads[0]?.count > 0) {
            return res.status(400).json({ 
                message: `لا يمكن حذف المدير لأن لديه ${leads[0].count} طلبات مرتبطة`,
                hasLeads: true
            });
        }
        
        await db.execute('DELETE FROM managers WHERE id = ?', [id]);
        
        console.log(`✅ Manager ${id} deleted`);
        res.json({ message: 'تم حذف المدير بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting manager:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف المدير', error: error.message });
    }
};

// =============================================
// إحصائيات وإدارة عامة
// =============================================

// الحصول على إحصائيات الطلبات
exports.getLeadStats = async (req, res) => {
    try {
        console.log(`📈 Getting lead statistics`);
        
        const resultStats = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status = 'approved_by_admin' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'sent_to_manager' THEN 1 ELSE 0 END) as sent_to_manager,
                SUM(CASE WHEN status = 'assigned_to_company' THEN 1 ELSE 0 END) as assigned_to_company,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                COALESCE(SUM(commission), 0) as total_commission,
                COALESCE(SUM(estimated_price), 0) as total_value,
                COALESCE(SUM(required_kw), 0) as total_kw
            FROM leads
        `);
        const stats = resultStats.rows || resultStats;
        
        // إحصائيات حسب المدينة
        const resultCityStats = await db.query(`
            SELECT city, COUNT(*) as count, SUM(commission) as commission
            FROM leads
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        `);
        const cityStats = resultCityStats.rows || resultCityStats;
        
        // إحصائيات حسب الشهر
        const resultMonthlyStats = await db.query(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count,
                SUM(commission) as commission
            FROM leads
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 12
        `);
        const monthlyStats = resultMonthlyStats.rows || resultMonthlyStats;
        
        const result = stats[0] || { 
            total: 0, new: 0, approved: 0, sent_to_manager: 0, assigned_to_company: 0,
            completed: 0, rejected: 0, total_commission: 0, total_value: 0, total_kw: 0
        };
        
        console.log(`📊 Stats: total=${result.total}, commission=${result.total_commission}`);
        
        res.json({
            ...result,
            byCity: cityStats || [],
            byMonth: monthlyStats || []
        });
        
    } catch (error) {
        console.error('❌ Error getting lead stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// الحصول على تقرير مفصل
exports.getDetailedReport = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        let dateFilter = '';
        const params = [];
        
        if (startDate) {
            dateFilter += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            dateFilter += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }
        
        const resultLeads = await db.query(`
            SELECT id, user_name, phone, city, monthly_bill, required_kw, 
                   estimated_price, commission, status, created_at, updated_at
            FROM leads
            WHERE 1=1 ${dateFilter}
            ORDER BY created_at DESC
        `, params);
        const leads = resultLeads.rows || resultLeads;
        
        const resultSummary = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(commission) as total_commission,
                AVG(monthly_bill) as avg_bill,
                AVG(required_kw) as avg_kw
            FROM leads
            WHERE 1=1 ${dateFilter}
        `, params);
        const summary = resultSummary.rows || resultSummary;
        
        res.json({
            summary: summary[0] || {},
            leads: leads || []
        });
        
    } catch (error) {
        console.error('❌ Error getting detailed report:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب التقرير', error: error.message });
    }
};

// =============================================
// إدارة الشركات (لأدمن)
// =============================================

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, city, description, rating, projects_count, is_active, created_at
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
        const { name, email, password, phone, city, description } = req.body;
        
        const resultExisting = await db.query('SELECT id FROM companies WHERE email = ?', [email]);
        const existing = resultExisting.rows || resultExisting;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await db.execute(
            `INSERT INTO companies (name, email, password, phone, city, description) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone || null, city || null, description || null]
        );
        
        res.status(201).json({ message: 'تم إضافة الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الشركة' });
    }
};

// تحديث شركة
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, city, description, rating, is_active } = req.body;
        
        await db.execute(
            `UPDATE companies 
             SET name = ?, phone = ?, city = ?, description = ?, rating = ?, is_active = ?
             WHERE id = ?`,
            [name, phone || null, city || null, description || null, rating || 0, is_active !== undefined ? is_active : 1, id]
        );
        
        res.json({ message: 'تم تحديث الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating company:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الشركة' });
    }
};