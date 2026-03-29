const db = require('../config/database');

// الحصول على طلبات المدير
exports.getMyLeads = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Manager ${managerId} fetching leads, status: ${status}`);
        
        let query = `
            SELECT l.*, 
                   ma.assigned_at, 
                   ma.notes, 
                   ma.status as assignment_status,
                   c.name as company_name,
                   c.rating as company_rating
            FROM leads l
            LEFT JOIN manager_assignments ma ON l.id = ma.lead_id AND ma.manager_id = $1
            LEFT JOIN companies c ON l.company_id = c.id
            WHERE ma.manager_id = $1 OR l.manager_id = $1
        `;
        const queryParams = [managerId];
        
        if (status && status !== 'all') {
            query += ' AND l.status = $2';
            queryParams.push(status);
            query += ' ORDER BY l.created_at DESC LIMIT $3 OFFSET $4';
            queryParams.push(parseInt(limit), parseInt(offset));
        } else {
            query += ' ORDER BY l.created_at DESC LIMIT $2 OFFSET $3';
            queryParams.push(parseInt(limit), parseInt(offset));
        }
        
        const result = await db.query(query, queryParams);
        const leads = result.rows || result;
        
        console.log(`✅ Found ${leads?.length || 0} leads`);
        res.json(leads || []);
        
    } catch (error) {
        console.error('❌ Error getting manager leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلبات', error: error.message });
    }
};

// تحديث حالة طلب
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status, notes } = req.body;
        const managerId = req.user.id;
        
        console.log(`🔄 Updating lead ${leadId} to status: ${status}`);
        
        // التحقق من أن الطلب للمدير
        const resultAssign = await db.query(
            `SELECT id FROM manager_assignments 
             WHERE lead_id = $1 AND manager_id = $2`,
            [leadId, managerId]
        );
        const assignments = resultAssign.rows || resultAssign;
        
        if (!assignments || assignments.length === 0) {
            // إذا لم يكن هناك تعيين، أنشئ واحداً
            await db.query(
                `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, status, notes) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [leadId, managerId, managerId, status, notes || null]
            );
        } else {
            // تحديث التعيين الموجود
            await db.query(
                `UPDATE manager_assignments 
                 SET status = $1, notes = $2, assigned_at = CURRENT_TIMESTAMP 
                 WHERE lead_id = $3 AND manager_id = $4`,
                [status, notes || null, leadId, managerId]
            );
        }
        
        // تحديث lead
        await db.query(
            `UPDATE leads 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [status, leadId]
        );
        
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

// الحصول على إحصائيات المدير
exports.getManagerStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        
        console.log(`📈 Getting stats for manager ${managerId}`);
        
        const result = await db.query(`
            SELECT 
                COUNT(CASE WHEN l.status = 'sent_to_manager' THEN 1 END) as pending,
                COUNT(CASE WHEN l.status = 'assigned_to_company' THEN 1 END) as assigned,
                COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN l.status = 'rejected' THEN 1 END) as rejected,
                COALESCE(SUM(CASE WHEN l.status = 'completed' THEN l.commission ELSE 0 END), 0) as total_commission,
                COALESCE(SUM(CASE WHEN l.status = 'sent_to_operations' THEN l.commission ELSE 0 END), 0) as sent_to_operations_commission,
                COALESCE(SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END), 0) as total_completed_count
            FROM leads l
            LEFT JOIN manager_assignments ma ON l.id = ma.lead_id
            WHERE ma.manager_id = $1 OR l.manager_id = $1
        `, [managerId]);
        
        const statsArray = result.rows || result;
        const stats = statsArray[0] || { 
            pending: 0, 
            assigned: 0,
            completed: 0, 
            rejected: 0, 
            total_commission: 0,
            sent_to_operations_commission: 0,
            total_completed_count: 0
        };
        
        console.log(`📊 Stats: pending=${stats.pending}, completed=${stats.completed}, commission=${stats.total_commission}`);
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting manager stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// إرسال طلب لشركة
exports.assignToCompany = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { companyId, price, notes } = req.body;
        const managerId = req.user.id;
        
        console.log(`🏢 Assigning lead ${leadId} to company ${companyId} with price ${price}`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // التحقق من وجود الشركة
        const resultCompany = await db.query('SELECT id, name FROM companies WHERE id = $1', [companyId]);
        const companies = resultCompany.rows || resultCompany;
        if (!companies || companies.length === 0) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        const company = companies[0];
        
        // تحديث lead مع company_id
        await db.query(
            `UPDATE leads 
             SET status = 'assigned_to_company', 
                 company_id = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [companyId, leadId]
        );
        
        // إضافة أو تحديث في lead_companies
        const resultExisting = await db.query(
            `SELECT id FROM lead_companies 
             WHERE lead_id = $1 AND company_id = $2`,
            [leadId, companyId]
        );
        const existing = resultExisting.rows || resultExisting;
        
        if (existing && existing.length > 0) {
            await db.query(
                `UPDATE lead_companies 
                 SET assigned_by = $1, price = $2, notes = $3, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
                 WHERE lead_id = $4 AND company_id = $5`,
                [managerId, price || null, notes || null, leadId, companyId]
            );
        } else {
            await db.query(
                `INSERT INTO lead_companies (lead_id, company_id, assigned_by, price, notes, status) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [leadId, companyId, managerId, price || null, notes || null, 'assigned']
            );
        }
        
        // تحديث أو إنشاء manager_assignments
        const resultAssignment = await db.query(
            `SELECT id FROM manager_assignments WHERE lead_id = $1 AND manager_id = $2`,
            [leadId, managerId]
        );
        const assignment = resultAssignment.rows || resultAssignment;
        
        if (assignment && assignment.length > 0) {
            await db.query(
                `UPDATE manager_assignments 
                 SET status = 'assigned_to_company', notes = $1, assigned_at = CURRENT_TIMESTAMP
                 WHERE lead_id = $2 AND manager_id = $3`,
                [notes || `تم إرسال الطلب للشركة: ${company.name}`, leadId, managerId]
            );
        } else {
            await db.query(
                `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, status, notes) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [leadId, managerId, managerId, 'assigned_to_company', `تم إرسال الطلب للشركة: ${company.name}`]
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

// الحصول على تفاصيل طلب محدد للمدير
exports.getLeadDetails = async (req, res) => {
    try {
        const { leadId } = req.params;
        const managerId = req.user.id;
        
        const result = await db.query(`
            SELECT l.*, 
                   c.name as company_name,
                   c.phone as company_phone,
                   c.city as company_city,
                   ma.notes as manager_notes,
                   ma.assigned_at
            FROM leads l
            LEFT JOIN companies c ON l.company_id = c.id
            LEFT JOIN manager_assignments ma ON l.id = ma.lead_id AND ma.manager_id = $1
            WHERE l.id = $2
        `, [managerId, leadId]);
        
        const leads = result.rows || result;
        
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        res.json(leads[0]);
        
    } catch (error) {
        console.error('❌ Error getting lead details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب' });
    }
};

// الحصول على قائمة الشركات المتاحة
exports.getAvailableCompanies = async (req, res) => {
    try {
        const { city, leadId } = req.query;
        
        let query = 'SELECT id, name, city, rating, projects_count, description FROM companies WHERE is_active = 1';
        const params = [];
        
        if (city) {
            query += ' AND city = $1';
            params.push(city);
        }
        
        query += ' ORDER BY rating DESC';
        
        const result = await db.query(query, params);
        const companies = result.rows || result;
        
        res.json(companies || []);
        
    } catch (error) {
        console.error('❌ Error getting available companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات' });
    }
};

// =============================================
// إرسال الطلب لمدير العمليات (مع العمولة)
// =============================================
exports.sendToOperationsManager = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes } = req.body;
        const executiveId = req.user.id;
        
        console.log(`📤 Executive ${executiveId} sending lead ${leadId} to operations manager`);
        
        // التحقق من وجود الطلب
        const resultLead = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const leads = resultLead.rows || resultLead;
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const lead = leads[0];
        const commission = lead.commission || (lead.required_kw * 150);
        
        console.log(`💰 Commission for lead ${leadId}: ${commission} TND (${lead.required_kw} kW × 150)`);
        
        // الحصول على أول Operations Manager
        const resultOps = await db.query(`
            SELECT id, name FROM managers 
            WHERE role = 'operations' 
            ORDER BY id ASC LIMIT 1
        `);
        const operationsManagers = resultOps.rows || resultOps;
        
        if (!operationsManagers || operationsManagers.length === 0) {
            return res.status(404).json({ message: 'لا يوجد مدير عمليات متاح' });
        }
        
        const operationsManager = operationsManagers[0];
        
        // تحديث الطلب: تغيير الحالة وتعيين لمدير العمليات
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations', 
                 manager_id = $1, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [operationsManager.id, leadId]
        );
        
        // تسجيل التعيين مع العمولة
        await db.query(
            `INSERT INTO manager_assignments (lead_id, manager_id, assigned_by, notes, status) 
             VALUES ($1, $2, $3, $4, $5)`,
            [leadId, operationsManager.id, executiveId, notes || `تم إرسال الطلب من قبل المدير التنفيذي - العمولة: ${commission} دينار`, 'pending']
        );
        
        console.log(`✅ Lead ${leadId} sent to operations manager ${operationsManager.id} with commission ${commission}`);
        
        res.json({ 
            message: `تم إرسال الطلب لمدير العمليات: ${operationsManager.name} (العمولة: ${commission} دينار)`,
            leadId,
            operationsManagerId: operationsManager.id,
            operationsManagerName: operationsManager.name,
            commission: commission
        });
        
    } catch (error) {
        console.error('❌ Error sending to operations:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب لمدير العمليات', error: error.message });
    }
};