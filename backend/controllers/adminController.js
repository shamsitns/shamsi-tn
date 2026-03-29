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
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // تحديث حالة الطلب
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

// رفض طلب
exports.rejectLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;
        
        console.log(`❌ Admin ${adminId} rejecting lead ${leadId}, reason: ${reason}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // تحديث حالة الطلب
        await db.query(
            `UPDATE leads 
             SET status = 'rejected', 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [leadId]
        );
        
        // تسجيل سبب الرفض في جدول منفصل (اختياري)
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

// إرسال طلب لمدير
exports.sendToManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { managerId, notes } = req.body;
        const adminId = req.user.id;
        
        console.log(`📨 Admin ${adminId} sending lead ${leadId} to manager ${managerId}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // التحقق من وجود المدير (مدير تنفيذي فقط)
        const resultManager = await db.query(
            'SELECT id, name FROM managers WHERE id = $1 AND (role = $2 OR role IS NULL)',
            [managerId, 'executive']
        );
        const managers = resultManager.rows || resultManager;
        if (!managers || managers.length === 0) {
            return res.status(404).json({ message: 'المدير غير موجود أو ليس مديراً تنفيذياً' });
        }
        
        const manager = managers[0];
        
        // تحديث lead
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_manager', 
                 manager_id = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [managerId, leadId]
        );
        
        // إضافة تعيين في manager_assignments
        const resultExisting = await db.query(
            `SELECT id FROM manager_assignments 
             WHERE lead_id = $1 AND manager_id = $2`,
            [leadId, managerId]
        );
        const existing = resultExisting.rows || resultExisting;
        
        if (existing && existing.length > 0) {
            await db.query(
                `UPDATE manager_assignments 
                 SET assigned_by = $1, notes = $2, status = 'pending', assigned_at = CURRENT_TIMESTAMP
                 WHERE lead_id = $3 AND manager_id = $4`,
                [adminId, notes || `تم إرسال الطلب من قبل الأدمن`, leadId, managerId]
            );
        } else {
            await db.query(
                `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes, status) 
                 VALUES ($1, $2, $3, $4, $5)`,
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

// الحصول على جميع المديرين التنفيذيين فقط (لإرسال الطلبات)
exports.getAllManagers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, email, phone, company_name, city, 
                   (SELECT COUNT(*) FROM leads WHERE manager_id = managers.id) as assigned_leads_count,
                   (SELECT COUNT(*) FROM leads WHERE manager_id = managers.id AND status = 'completed') as completed_leads_count,
                   created_at
            FROM managers 
            WHERE role = 'executive' OR role IS NULL
            ORDER BY created_at DESC
        `);
        const managers = result.rows || result;
        
        console.log(`👥 Found ${managers?.length || 0} executive managers`);
        res.json(managers || []);
        
    } catch (error) {
        console.error('❌ Error getting managers:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب المديرين', error: error.message });
    }
};

// إضافة مدير جديد
exports.addManager = async (req, res) => {
    try {
        const { name, email, password, phone, company_name, city, role } = req.body;
        
        console.log(`👥 Adding new manager: ${name}, ${email}, role: ${role || 'executive'}`);
        
        // التحقق من وجود البريد
        const resultExisting = await db.query('SELECT id FROM managers WHERE email = $1', [email]);
        const existing = resultExisting.rows || resultExisting;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        const managerRole = role || 'executive';
        
        await db.query(
            `INSERT INTO managers (name, email, password, phone, company_name, city, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, email, hashedPassword, phone || null, company_name || null, city || null, managerRole]
        );
        
        console.log(`✅ Manager ${name} added successfully`);
        res.status(201).json({ 
            message: 'تم إضافة المدير بنجاح',
            manager: { name, email, role: managerRole }
        });
        
    } catch (error) {
        console.error('❌ Error adding manager:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة المدير', error: error.message });
    }
};

// =============================================
// حذف الطلبات (مع حذف جميع البيانات المرتبطة)
// =============================================

// حذف طلب فردي (مع حذف جميع البيانات المرتبطة)
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting lead ${leadId} and all related data`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // حذف البيانات المرتبطة بالطلب من جميع الجداول
        // 1. حذف من lead_companies
        await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [leadId]);
        
        // 2. حذف من manager_assignments
        await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [leadId]);
        
        // 3. حذف من lead_rejections
        await db.query('DELETE FROM lead_rejections WHERE lead_id = $1', [leadId]);
        
        // 4. حذف الطلب نفسه من leads
        await db.query('DELETE FROM leads WHERE id = $1', [leadId]);
        
        console.log(`✅ Lead ${leadId} and all related data deleted successfully`);
        res.json({ 
            message: 'تم حذف الطلب وجميع البيانات المرتبطة بنجاح',
            leadId
        });
        
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب', error: error.message });
    }
};

// حذف جميع الطلبات (مع حذف جميع البيانات المرتبطة)
exports.deleteAllLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting ALL leads and related data`);
        
        // حذف جميع البيانات المرتبطة
        await db.query('DELETE FROM lead_companies');
        await db.query('DELETE FROM manager_assignments');
        await db.query('DELETE FROM lead_rejections');
        
        // حذف جميع الطلبات
        await db.query('DELETE FROM leads');
        
        // إعادة تعيين التسلسل
        await db.query('SELECT setval(\'leads_id_seq\', 1, false)');
        
        console.log(`✅ All leads and related data deleted successfully`);
        res.json({ 
            message: 'تم حذف جميع الطلبات والبيانات المرتبطة بنجاح',
            deletedCount: 'all'
        });
        
    } catch (error) {
        console.error('❌ Error deleting all leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات', error: error.message });
    }
};

// حذف الطلبات المرفوضة فقط (مع حذف البيانات المرتبطة)
exports.deleteRejectedLeads = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        console.log(`🗑️ Admin ${adminId} deleting rejected leads`);
        
        // الحصول على IDs الطلبات المرفوضة
        const rejectedLeads = await db.query('SELECT id FROM leads WHERE status = $1', ['rejected']);
        const leadIds = rejectedLeads.rows || rejectedLeads;
        
        if (leadIds.length > 0) {
            // حذف البيانات المرتبطة لكل طلب مرفوض
            for (const lead of leadIds) {
                await db.query('DELETE FROM lead_companies WHERE lead_id = $1', [lead.id]);
                await db.query('DELETE FROM manager_assignments WHERE lead_id = $1', [lead.id]);
                await db.query('DELETE FROM lead_rejections WHERE lead_id = $1', [lead.id]);
            }
            
            // حذف الطلبات المرفوضة
            await db.query('DELETE FROM leads WHERE status = $1', ['rejected']);
        }
        
        const deletedCount = leadIds.length;
        
        console.log(`✅ ${deletedCount} rejected leads and related data deleted`);
        res.json({ 
            message: `تم حذف ${deletedCount} طلب مرفوض وجميع البيانات المرتبطة بنجاح`,
            deletedCount 
        });
        
    } catch (error) {
        console.error('❌ Error deleting rejected leads:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلبات المرفوضة', error: error.message });
    }
};

// =============================================
// إحصائيات وإدارة عامة
// =============================================

// الحصول على إحصائيات الطلبات (بدون strftime)
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
            SELECT city, COUNT(*) as count, COALESCE(SUM(commission), 0) as commission
            FROM leads
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        `);
        const cityStats = resultCityStats.rows || resultCityStats;
        
        const result = stats[0] || { 
            total: 0, new: 0, approved: 0, sent_to_manager: 0, assigned_to_company: 0,
            completed: 0, rejected: 0, total_commission: 0, total_value: 0, total_kw: 0
        };
        
        console.log(`📊 Stats: total=${result.total}, commission=${result.total_commission}`);
        
        res.json({
            ...result,
            byCity: cityStats || []
        });
        
    } catch (error) {
        console.error('❌ Error getting lead stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};