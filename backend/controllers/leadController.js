const db = require('../config/database');
const { calculateSolarSystem } = require('../utils/solarCalculator');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// حساب النظام الشمسي فقط (بدون حفظ)
// =============================================
exports.calculateLead = async (req, res) => {
    try {
        console.log('📝 Calculation request:', req.body);
        
        const {
            name,
            phone,
            city,
            property_type,
            bill_period_months,
            bill_season,
            bill_amount,
            roof_availability
        } = req.body;
        
        if (!bill_amount) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['قيمة الفاتورة مطلوبة']
            });
        }
        
        // Calculate solar system
        const solarData = calculateSolarSystem(
            parseFloat(bill_amount),
            parseInt(bill_period_months) || 60,
            bill_season || 'spring',
            property_type || 'house'
        );
        
        console.log('✅ Calculation completed:', solarData);
        
        res.status(200).json({
            message: 'تم حساب النظام الشمسي بنجاح',
            solarData
        });
        
    } catch (error) {
        console.error('❌ Error calculating:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في حساب النظام الشمسي',
            error: error.message 
        });
    }
};

// =============================================
// إنشاء طلب جديد (حفظ) - مع جميع المعلومات
// =============================================
exports.createLead = async (req, res) => {
    try {
        console.log('📝 Creating lead:', req.body);
        
        const {
            name,
            phone,
            city,
            property_type,
            bill_period_months,
            bill_season,
            bill_amount,
            roof_availability,
            meter_number,
            payment_method,
            preferred_bank,
            panel_type,
            additional_info
        } = req.body;
        
        // Validation
        if (!name || !phone || !bill_amount) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، وقيمة الفاتورة مطلوبة']
            });
        }
        
        // Calculate solar system
        const solarData = calculateSolarSystem(
            parseFloat(bill_amount),
            parseInt(bill_period_months) || 60,
            bill_season || 'spring',
            property_type || 'house'
        );
        
        // Calculate commission (150 DT per kW)
        const commissionAmount = solarData.required_kw * 150;
        
        // جمع جميع المعلومات الإضافية في حقل واحد
        let fullAdditionalInfo = '';
        if (meter_number) fullAdditionalInfo += `🔢 رقم العداد: ${meter_number}\n`;
        if (payment_method) fullAdditionalInfo += `💰 طريقة الدفع: ${payment_method}\n`;
        if (preferred_bank) fullAdditionalInfo += `🏦 البنك المختار: ${preferred_bank}\n`;
        if (panel_type) fullAdditionalInfo += `🔋 نوع اللوح: ${panel_type}\n`;
        if (additional_info) fullAdditionalInfo += `📋 معلومات إضافية: ${additional_info}\n`;
        if (roof_availability !== undefined) fullAdditionalInfo += `🏠 توفر السطح: ${roof_availability ? 'نعم' : 'لا'}\n`;
        
        console.log('📋 Full additional info:', fullAdditionalInfo);
        
        // ✅ INSERT مع 13 قيمة فقط (بدون created_at)
        const query = `
            INSERT INTO leads (
                name, phone, city, property_type, 
                bill_amount, bill_period_months, bill_season,
                roof_availability, additional_info,
                required_kw, panels_count, commission_amount,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
        `;
        
        const values = [
            name,
            phone,
            city || null,
            property_type || 'house',
            parseFloat(bill_amount),
            parseInt(bill_period_months) || 60,
            bill_season || 'spring',
            roof_availability !== undefined ? roof_availability : true,
            fullAdditionalInfo || null,
            solarData.required_kw,
            solarData.panels_count,
            commissionAmount,
            'pending'
        ];
        
        const result = await db.query(query, values);
        const leadId = getFirstRow(result)?.id;
        
        console.log(`✅ Lead created successfully with ID: ${leadId}`);
        console.log(`   📊 Required KW: ${solarData.required_kw} kWp`);
        console.log(`   💰 Commission: ${commissionAmount} DT`);
        console.log(`   📋 Info: ${fullAdditionalInfo}`);
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: leadId,
            solarData: {
                required_kw: solarData.required_kw,
                panels_count: solarData.panels_count,
                annual_production: solarData.annual_production,
                annual_savings: solarData.annual_savings,
                co2_saved: solarData.co2_saved,
                commission_amount: commissionAmount
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating lead:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في الخادم',
            error: error.message 
        });
    }
};

// =============================================
// الحصول على طلب محدد
// =============================================
exports.getLead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT l.*, 
                   u.name as assigned_to_name,
                   u.role as assigned_role,
                   c.name as company_name
            FROM leads l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN companies c ON l.assigned_company_id = c.id
            WHERE l.id = $1
        `, [id]);
        
        const lead = getFirstRow(result);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        res.json(lead);
        
    } catch (error) {
        console.error('❌ Error getting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلب', error: error.message });
    }
};

// =============================================
// تحديث حالة الطلب (للمديرين)
// =============================================
exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user?.id;
        
        const validStatuses = ['pending', 'approved', 'contacted', 'sent_to_operations', 'assigned_to_company', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'حالة غير صالحة' });
        }
        
        // Check if lead exists
        const existingResult = await db.query('SELECT id, status FROM leads WHERE id = $1', [id]);
        const existing = getFirstRow(existingResult);
        
        if (!existing) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const oldStatus = existing.status;
        
        // Update lead status with appropriate fields
        let updateQuery = `UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP`;
        const params = [status];
        let paramIndex = 2;
        
        if (status === 'approved') {
            updateQuery += `, approved_by = $${paramIndex}, approved_at = CURRENT_TIMESTAMP`;
            params.push(userId);
            paramIndex++;
        } else if (status === 'contacted') {
            updateQuery += `, contacted_by = $${paramIndex}, contacted_at = CURRENT_TIMESTAMP`;
            params.push(userId);
            paramIndex++;
        } else if (status === 'sent_to_operations') {
            updateQuery += `, sent_to_operations_by = $${paramIndex}, sent_to_operations_at = CURRENT_TIMESTAMP`;
            params.push(userId);
            paramIndex++;
        }
        
        if (notes) {
            updateQuery += `, notes = $${paramIndex}`;
            params.push(notes);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex}`;
        params.push(id);
        
        await db.query(updateQuery, params);
        
        // Add to lead history
        await db.addLeadHistory(id, 'status_updated', oldStatus, status, userId, notes);
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action, details) 
             VALUES ($1, $2, $3)`,
            [userId, 'lead_status_updated', `تم تحديث حالة الطلب ${id} من ${oldStatus} إلى ${status}`]
        );
        
        console.log(`✅ Lead ${id} status updated from ${oldStatus} to ${status}`);
        res.json({ 
            message: 'تم تحديث حالة الطلب بنجاح',
            leadId: id,
            status: status,
            oldStatus: oldStatus
        });
        
    } catch (error) {
        console.error('❌ Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في تحديث حالة الطلب', error: error.message });
    }
};

// =============================================
// الحصول على طلبات المستخدم الحالي
// =============================================
exports.getMyLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `SELECT * FROM leads WHERE 1=1`;
        const params = [];
        let paramIndex = 1;
        
        // Filter by role
        if (role === 'executive_manager' || role === 'call_center' || role === 'operations_manager') {
            query += ` AND created_by = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }
        
        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        const leads = getRows(result);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM leads WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;
        
        if (role === 'executive_manager' || role === 'call_center' || role === 'operations_manager') {
            countQuery += ` AND created_by = $${countIndex}`;
            countParams.push(userId);
            countIndex++;
        }
        
        if (status && status !== 'all') {
            countQuery += ` AND status = $${countIndex}`;
            countParams.push(status);
            countIndex++;
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = getFirstRow(countResult)?.total || 0;
        
        res.json({
            leads: leads || [],
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
        
    } catch (error) {
        console.error('❌ Error getting my leads:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الطلبات', error: error.message });
    }
};

// =============================================
// إضافة ملاحظات للطلب
// =============================================
exports.addLeadNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = req.user?.id;
        
        if (!notes) {
            return res.status(400).json({ message: 'الملاحظات مطلوبة' });
        }
        
        // Check if lead exists
        const existingResult = await db.query('SELECT id FROM leads WHERE id = $1', [id]);
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // Append note to existing notes
        await db.query(
            `UPDATE leads 
             SET notes = COALESCE(notes, '') || '\n' || $1,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [`[${new Date().toISOString()}] المستخدم ${userId}: ${notes}`, id]
        );
        
        console.log(`✅ Note added to lead ${id}`);
        res.json({ message: 'تم إضافة الملاحظة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error adding lead note:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الملاحظة', error: error.message });
    }
};