const db = require('../config/database');

const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// الحصول على طلبات التأجير المخصصة
// =============================================
exports.getMyLeasingRequests = async (req, res) => {
    try {
        const leasingManagerId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT fr.*, 
                   l.name as client_name, 
                   l.phone as client_phone,
                   l.city as client_city,
                   l.bill_amount,
                   l.required_kw,
                   l.property_type
            FROM financing_requests fr
            JOIN leads l ON fr.lead_id = l.id
            WHERE fr.financing_type = 'leasing' AND fr.assigned_to = $1
        `;
        const params = [leasingManagerId];
        let paramIndex = 2;
        
        if (status && status !== 'all') {
            query += ` AND fr.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY fr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        const requests = getRows(result);
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM financing_requests fr
            WHERE fr.financing_type = 'leasing' AND fr.assigned_to = $1
        `;
        const countParams = [leasingManagerId];
        
        if (status && status !== 'all') {
            countQuery += ` AND fr.status = $2`;
            countParams.push(status);
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = getFirstRow(countResult)?.total || 0;
        
        res.json({
            requests: requests || [],
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting leasing requests:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب طلبات التأجير', error: error.message });
    }
};

// =============================================
// تحديث حالة طلب تأجير
// =============================================
exports.updateLeasingStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, approved_amount, down_payment, duration_years, monthly_payment, notes } = req.body;
        const leasingManagerId = req.user.id;
        
        const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'completed'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        const existingResult = await db.query(
            `SELECT id, lead_id FROM financing_requests 
             WHERE id = $1 AND financing_type = 'leasing' AND assigned_to = $2`,
            [requestId, leasingManagerId]
        );
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'طلب التأجير غير موجود' });
        }
        
        let updateQuery = `
            UPDATE financing_requests 
            SET status = $1, 
                updated_at = CURRENT_TIMESTAMP
        `;
        const params = [status];
        let paramIndex = 2;
        
        if (approved_amount) {
            updateQuery += `, approved_amount = $${paramIndex}`;
            params.push(approved_amount);
            paramIndex++;
        }
        
        if (down_payment) {
            updateQuery += `, down_payment = $${paramIndex}`;
            params.push(down_payment);
            paramIndex++;
        }
        
        if (duration_years) {
            updateQuery += `, duration_years = $${paramIndex}`;
            params.push(duration_years);
            paramIndex++;
        }
        
        if (monthly_payment) {
            updateQuery += `, monthly_installment = $${paramIndex}`;
            params.push(monthly_payment);
            paramIndex++;
        }
        
        if (notes) {
            updateQuery += `, notes = $${paramIndex}`;
            params.push(notes);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex}`;
        params.push(requestId);
        
        await db.query(updateQuery, params);
        
        if (status === 'approved') {
            await db.query(
                `UPDATE leads 
                 SET financing_status = 'approved', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [existing[0].lead_id]
            );
        } else if (status === 'rejected') {
            await db.query(
                `UPDATE leads 
                 SET financing_status = 'rejected', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [existing[0].lead_id]
            );
        }
        
        console.log(`✅ Leasing request ${requestId} updated to ${status}`);
        res.json({ 
            message: 'تم تحديث حالة طلب التأجير بنجاح',
            requestId,
            status
        });
        
    } catch (error) {
        console.error('❌ Error updating leasing status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث حالة التأجير', error: error.message });
    }
};

// =============================================
// الحصول على إحصائيات شركة التأجير
// =============================================
exports.getLeasingStats = async (req, res) => {
    try {
        const leasingManagerId = req.user.id;
        
        const result = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END), 0) as total_approved_amount
            FROM financing_requests
            WHERE financing_type = 'leasing' AND assigned_to = $1
        `, [leasingManagerId]);
        
        const stats = getFirstRow(result) || { 
            pending: 0, under_review: 0, approved: 0, rejected: 0, completed: 0, total_approved_amount: 0
        };
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting leasing stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// الحصول على تفاصيل طلب تأجير
// =============================================
exports.getLeasingRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;
        const leasingManagerId = req.user.id;
        
        const result = await db.query(`
            SELECT fr.*, 
                   l.name as client_name, 
                   l.phone as client_phone,
                   l.email as client_email,
                   l.city as client_city,
                   l.property_type,
                   l.bill_amount,
                   l.required_kw,
                   l.roof_availability,
                   l.additional_info,
                   lc.name as leasing_company_name
            FROM financing_requests fr
            JOIN leads l ON fr.lead_id = l.id
            LEFT JOIN leasing_companies lc ON fr.leasing_id = lc.id
            WHERE fr.id = $1 AND fr.financing_type = 'leasing' AND fr.assigned_to = $2
        `, [requestId, leasingManagerId]);
        
        const request = getFirstRow(result);
        
        if (!request) {
            return res.status(404).json({ message: 'طلب التأجير غير موجود' });
        }
        
        res.json(request);
        
    } catch (error) {
        console.error('❌ Error getting request details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب', error: error.message });
    }
};

// =============================================
// الحصول على قائمة شركات التأجير المتاحة
// =============================================
exports.getAvailableLeasingCompanies = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, contact_person, email, phone, down_payment_percent, max_contract_years
            FROM leasing_companies
            WHERE is_active = 1
            ORDER BY name ASC
        `);
        
        const companies = getRows(result);
        res.json(companies || []);
        
    } catch (error) {
        console.error('❌ Error getting leasing companies:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب شركات التأجير', error: error.message });
    }
};