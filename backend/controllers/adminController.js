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
        const { status, page = 1, limit = 20, city, fromDate, toDate } = req.query;
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
            WHERE city IS NOT NULL AND city != ''
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
        
        // استخدام date_trunc لـ PostgreSQL و strftime لـ SQLite
        const dbType = getDbType();
        let monthlyQuery;
        
        if (dbType === 'postgres') {
            monthlyQuery = `
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                    COUNT(*) as count,
                    COALESCE(SUM(commission_amount), 0) as commission
                FROM leads
                WHERE created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
            `;
        } else {
            monthlyQuery = `
                SELECT 
                    strftime('%Y-%m', created_at) as month,
                    COUNT(*) as count,
                    COALESCE(SUM(commission_amount), 0) as commission
                FROM leads
                WHERE created_at >= datetime('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month DESC
            `;
        }
        
        const resultMonthlyStats = await db.query(monthlyQuery);
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
        
        // التحقق من وجود طلبات مرتبطة
        const resultLeads = await db.query('SELECT COUNT(*) as count FROM leads WHERE created_by = $1', [id]);
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
// إدارة الطلبات (موافقة/رفض)
// =============================================
exports.approveLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user?.id;
        
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
        const adminId = req.user?.id;
        
        console.log(`❌ Admin ${adminId} rejecting lead ${leadId}`);
        
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = getRows(resultLead);
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'cancelled', 
                 notes = COALESCE(notes, '') || '\n' || $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [`[${new Date().toISOString()}] تم رفض الطلب من قبل المدير العام: ${reason || 'لا يوجد سبب'}`, leadId]
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

// =============================================
// حذف الطلبات
// =============================================
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user?.id;
        
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

// =============================================
// إدارة الشركات
// =============================================

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, address, contact_person, 
                   description, rating, projects_count, established_year,
                   license_number, website, logo, is_active, created_at
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

// إضافة شركة جديدة
exports.addCompany = async (req, res) => {
    try {
        const { name, email, phone, address, contact_person, description, projects_count } = req.body;
        
        console.log(`🏢 Adding new company: ${name}, ${email}`);
        
        if (!name || !email) {
            return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
        }
        
        const resultExisting = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        const existing = getRows(resultExisting);
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        await db.query(`
            INSERT INTO companies (name, email, phone, address, contact_person, description, projects_count, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
        `, [name, email, phone || null, address || null, contact_person || null, description || null, projects_count || 0]);
        
        console.log(`✅ Company ${name} added successfully`);
        res.status(201).json({ 
            message: 'تم إضافة الشركة بنجاح',
            company: { name, email }
        });
        
    } catch (error) {
        console.error('❌ Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الشركة', error: error.message });
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

// =============================================
// الإحصائيات للـ Dashboard
// =============================================
exports.getStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                COALESCE(SUM(commission_amount), 0) as total_commission,
                COALESCE(SUM(required_kw), 0) as total_kw
            FROM leads
        `);
        
        const stats = getFirstRow(result) || {};
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};