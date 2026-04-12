const db = require('../config/database');

const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// تحديث حالة طلب تمويل
// =============================================
exports.updateFinancingStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, approved_amount, interest_rate, duration_years, notes } = req.body;
        const bankManagerId = req.user.id;
        
        console.log('📝 Updating financing request:', { requestId, status, approved_amount, interest_rate, duration_years, bankManagerId });
        
        const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'completed'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        // التحقق من وجود الطلب
        const existingResult = await db.query(
            `SELECT id, lead_id, status FROM financing_requests 
             WHERE id = $1 AND financing_type = 'bank' AND assigned_to = $2`,
            [requestId, bankManagerId]
        );
        const existing = getFirstRow(existingResult);
        
        if (!existing) {
            return res.status(404).json({ message: 'طلب التمويل غير موجود' });
        }
        
        // بناء استعلام التحديث
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
        
        if (approved_amount !== undefined && approved_amount !== '') {
            updates.push(`approved_amount = $${paramIndex}`);
            params.push(parseFloat(approved_amount));
            paramIndex++;
        }
        
        if (interest_rate !== undefined && interest_rate !== '') {
            updates.push(`interest_rate = $${paramIndex}`);
            params.push(parseFloat(interest_rate));
            paramIndex++;
        }
        
        if (duration_years !== undefined && duration_years !== '') {
            updates.push(`duration_years = $${paramIndex}`);
            params.push(parseInt(duration_years));
            paramIndex++;
        }
        
        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            params.push(notes);
            paramIndex++;
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        
        const query = `
            UPDATE financing_requests 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
        `;
        params.push(requestId);
        
        console.log('🔍 Update query:', query);
        console.log('🔍 Params:', params);
        
        await db.query(query, params);
        
        // تحديث lead إذا تمت الموافقة
        if (status === 'approved') {
            await db.query(
                `UPDATE leads 
                 SET financing_status = 'approved', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [existing.lead_id]
            );
        } else if (status === 'rejected') {
            await db.query(
                `UPDATE leads 
                 SET financing_status = 'rejected', 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [existing.lead_id]
            );
        }
        
        console.log(`✅ Financing request ${requestId} updated to ${status}`);
        res.json({ 
            message: 'تم تحديث حالة طلب التمويل بنجاح',
            requestId,
            status
        });
        
    } catch (error) {
        console.error('❌ Error updating financing status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث حالة التمويل', error: error.message });
    }
};

// =============================================
// الحصول على إحصائيات البنك
// =============================================
exports.getBankStats = async (req, res) => {
    try {
        const bankManagerId = req.user.id;
        
        const result = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END), 0) as total_approved_amount
            FROM financing_requests
            WHERE financing_type = 'bank' AND assigned_to = $1
        `, [bankManagerId]);
        
        const stats = getFirstRow(result) || { 
            pending: 0, under_review: 0, approved: 0, rejected: 0, completed: 0, total_approved_amount: 0
        };
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting bank stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// الحصول على تفاصيل طلب تمويل
// =============================================
exports.getFinancingRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;
        const bankManagerId = req.user.id;
        
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
                   b.name as bank_name
            FROM financing_requests fr
            JOIN leads l ON fr.lead_id = l.id
            LEFT JOIN banks b ON fr.bank_id = b.id
            WHERE fr.id = $1 AND fr.financing_type = 'bank' AND fr.assigned_to = $2
        `, [requestId, bankManagerId]);
        
        const request = getFirstRow(result);
        
        if (!request) {
            return res.status(404).json({ message: 'طلب التمويل غير موجود' });
        }
        
        res.json(request);
        
    } catch (error) {
        console.error('❌ Error getting request details:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب تفاصيل الطلب', error: error.message });
    }
};

// =============================================
// الحصول على قائمة البنوك المتاحة
// =============================================
exports.getAvailableBanks = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, contact_person, email, phone, interest_rate, max_financing_years
            FROM banks
            WHERE is_active = 1
            ORDER BY name ASC
        `);
        
        const banks = getRows(result);
        res.json(banks || []);
        
    } catch (error) {
        console.error('❌ Error getting banks:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب البنوك', error: error.message });
    }
};