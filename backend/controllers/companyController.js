const db = require('../config/database');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, email, phone, address, contact_person, is_active, created_at 
             FROM companies 
             ORDER BY name ASC`
        );
        const companies = getRows(result);
        
        console.log(`🏢 Found ${companies?.length || 0} companies`);
        res.json(companies || []);
    } catch (error) {
        console.error('❌ Error getting companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الشركات', error: error.message });
    }
};

// الحصول على شركة محددة
exports.getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT id, name, email, phone, address, contact_person, is_active, created_at 
             FROM companies 
             WHERE id = $1`,
            [id]
        );
        
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
        const { name, email, phone, address, contact_person } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
        }
        
        // Check if company already exists
        const existingResult = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        const existing = getRows(existingResult);
        
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود مسبقاً' });
        }
        
        await db.query(
            `INSERT INTO companies (name, email, phone, address, contact_person, is_active, created_at) 
             VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)`,
            [name, email, phone || null, address || null, contact_person || null]
        );
        
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

// تحديث شركة
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, contact_person, is_active } = req.body;
        
        // Check if company exists
        const existingResult = await db.query('SELECT id FROM companies WHERE id = $1', [id]);
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        await db.query(
            `UPDATE companies 
             SET name = $1, 
                 phone = $2, 
                 address = $3, 
                 contact_person = $4, 
                 is_active = $5,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6`,
            [name, phone || null, address || null, contact_person || null, is_active !== undefined ? is_active : true, id]
        );
        
        console.log(`✅ Company ${id} updated successfully`);
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
        
        // Check if company has leads
        const leadsResult = await db.query('SELECT COUNT(*) as count FROM lead_companies WHERE company_id = $1', [id]);
        const leads = getRows(leadsResult);
        
        if (leads[0]?.count > 0) {
            return res.status(400).json({ 
                message: `لا يمكن حذف الشركة لأن لديها ${leads[0].count} طلبات مرتبطة`,
                hasLeads: true
            });
        }
        
        // Check if company exists
        const existingResult = await db.query('SELECT id FROM companies WHERE id = $1', [id]);
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        await db.query('DELETE FROM companies WHERE id = $1', [id]);
        
        console.log(`✅ Company ${id} deleted successfully`);
        res.json({ message: 'تم حذف الشركة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting company:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الشركة', error: error.message });
    }
};

// الحصول على طلبات شركة محددة
exports.getCompanyLeads = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if company exists
        const companyResult = await db.query('SELECT id, name FROM companies WHERE id = $1', [id]);
        const company = getFirstRow(companyResult);
        
        if (!company) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        const result = await db.query(`
            SELECT l.id, l.name, l.phone, l.email, l.city, l.property_type, 
                   l.required_kw, l.panels_count, l.status, l.created_at,
                   lc.assigned_at, lc.status as assignment_status, lc.notes
            FROM leads l
            JOIN lead_companies lc ON l.id = lc.lead_id
            WHERE lc.company_id = $1
            ORDER BY lc.assigned_at DESC
        `, [id]);
        
        const leads = getRows(result);
        
        console.log(`🏢 Company ${company.name} has ${leads?.length || 0} leads`);
        res.json({
            company: company.name,
            leads: leads || []
        });
        
    } catch (error) {
        console.error('❌ Error getting company leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب طلبات الشركة', error: error.message });
    }
};

// تعيين طلب لشركة
exports.assignLeadToCompany = async (req, res) => {
    try {
        const { leadId, companyId } = req.params;
        const { notes, price } = req.body;
        const userId = req.user?.id;
        
        // Check if lead exists
        const leadResult = await db.query('SELECT id, status FROM leads WHERE id = $1', [leadId]);
        const lead = getFirstRow(leadResult);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // Check if company exists
        const companyResult = await db.query('SELECT id, name FROM companies WHERE id = $1', [companyId]);
        const company = getFirstRow(companyResult);
        
        if (!company) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        // Check if already assigned
        const existingResult = await db.query(
            'SELECT id FROM lead_companies WHERE lead_id = $1 AND company_id = $2',
            [leadId, companyId]
        );
        const existing = getRows(existingResult);
        
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'الطلب معين بالفعل لهذه الشركة' });
        }
        
        // Assign lead to company
        await db.query(
            `INSERT INTO lead_companies (lead_id, company_id, assigned_by, notes, status, assigned_at) 
             VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)`,
            [leadId, companyId, userId || null, notes || null]
        );
        
        // Update lead status
        await db.query(
            `UPDATE leads 
             SET status = 'assigned_to_company', 
                 assigned_company_id = $1,
                 assigned_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [companyId, leadId]
        );
        
        console.log(`✅ Lead ${leadId} assigned to company ${company.name}`);
        res.json({ 
            message: `تم إرسال الطلب للشركة: ${company.name}`,
            leadId,
            companyId,
            companyName: company.name
        });
        
    } catch (error) {
        console.error('❌ Error assigning lead to company:', error);
        res.status(500).json({ message: 'حدث خطأ في تعيين الطلب للشركة', error: error.message });
    }
};

// تحديث حالة تعيين طلب لشركة
exports.updateLeadAssignmentStatus = async (req, res) => {
    try {
        const { leadId, companyId } = req.params;
        const { status, notes } = req.body;
        
        const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        // Check if assignment exists
        const existingResult = await db.query(
            'SELECT id FROM lead_companies WHERE lead_id = $1 AND company_id = $2',
            [leadId, companyId]
        );
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'التعيين غير موجود' });
        }
        
        await db.query(
            `UPDATE lead_companies 
             SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE lead_id = $3 AND company_id = $4`,
            [status, notes || null, leadId, companyId]
        );
        
        // If company accepted, update lead status
        if (status === 'accepted') {
            await db.query(
                `UPDATE leads 
                 SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [leadId]
            );
        }
        
        // If company completed, update lead status
        if (status === 'completed') {
            await db.query(
                `UPDATE leads 
                 SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [leadId]
            );
        }
        
        console.log(`✅ Lead ${leadId} assignment status updated to ${status}`);
        res.json({ message: 'تم تحديث الحالة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error updating assignment status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث الحالة', error: error.message });
    }
};

// الحصول على إحصائيات الشركات
exports.getCompaniesStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.email,
                c.phone,
                c.is_active,
                COUNT(lc.lead_id) as total_leads,
                COUNT(CASE WHEN lc.status = 'completed' THEN 1 END) as completed_leads,
                COUNT(CASE WHEN lc.status = 'accepted' THEN 1 END) as accepted_leads,
                COUNT(CASE WHEN lc.status = 'pending' THEN 1 END) as pending_leads
            FROM companies c
            LEFT JOIN lead_companies lc ON c.id = lc.company_id
            GROUP BY c.id
            ORDER BY total_leads DESC
        `);
        
        const stats = getRows(result);
        res.json(stats || []);
        
    } catch (error) {
        console.error('❌ Error getting companies stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب إحصائيات الشركات', error: error.message });
    }
};