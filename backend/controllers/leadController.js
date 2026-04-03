const db = require('../config/database');
const { calculateSolarSystem } = require('../utils/solarCalculator');
const { COMMISSION_PER_KW, COMMISSION_TIERS } = require('../config/commission');

// Helper function to handle both PostgreSQL and SQLite results
const getRows = (result) => {
    return result.rows || result || [];
};

const getFirstRow = (result) => {
    const rows = getRows(result);
    return rows[0] || null;
};

// =============================================
// حساب lead score تلقائياً
// =============================================
const calculateLeadScore = (leadData) => {
    let score = 0;
    
    // فاتورة عالية = عميل جيد
    if (leadData.bill_amount > 500) score += 30;
    else if (leadData.bill_amount > 300) score += 20;
    else if (leadData.bill_amount > 150) score += 10;
    else if (leadData.bill_amount > 100) score += 5;
    
    // مساحة سطح كبيرة
    if (leadData.roof_area && leadData.roof_area > 100) score += 20;
    else if (leadData.roof_area && leadData.roof_area > 50) score += 10;
    else if (leadData.roof_area && leadData.roof_area > 30) score += 5;
    
    // مدينة كبيرة (إشعاع شمسي أفضل)
    const highRadiationCities = ['قبلي', 'تطاوين', 'مدنين', 'قفصة', 'صفاقس', 'القيروان'];
    if (highRadiationCities.includes(leadData.city)) score += 15;
    
    // المدن المتوسطة
    const mediumRadiationCities = ['تونس', 'سوسة', 'المنستير', 'نابل', 'بنزرت'];
    if (mediumRadiationCities.includes(leadData.city)) score += 10;
    
    // نوع العقار
    if (leadData.property_type === 'farm') score += 15;
    if (leadData.property_type === 'house') score += 10;
    if (leadData.property_type === 'commercial') score += 8;
    
    // توفر السطح
    if (leadData.roof_availability === true) score += 10;
    
    // رقم العداد موجود
    if (leadData.meter_number) score += 5;
    
    return Math.min(score, 100); // كحد أقصى 100
};

// =============================================
// حساب العمولة حسب القدرة (باستخدام tiers)
// =============================================
const calculateCommission = (requiredKw) => {
    // البحث عن الـ tier المناسب
    const tier = COMMISSION_TIERS.find(t => 
        requiredKw >= t.minKw && requiredKw < t.maxKw
    );
    
    if (tier) {
        return requiredKw * tier.rate;
    }
    
    // fallback إلى القيمة الافتراضية
    return requiredKw * COMMISSION_PER_KW;
};

// =============================================
// حساب النظام الشمسي فقط (بدون حفظ)
// =============================================
exports.calculateLead = async (req, res) => {
    try {
        // Log محدود للأمان (بدون بيانات حساسة)
        console.log('📝 Calculation request received');
        
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
        
        console.log(`✅ Calculation completed: ${solarData.required_kw} kWp`);
        
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
        // Log محدود للأمان
        console.log('📝 Creating new lead');
        
        const {
            name,
            phone,
            city,
            property_type,
            bill_period_months,
            bill_season,
            bill_amount,
            roof_availability,
            roof_area,
            meter_number,
            payment_method,
            preferred_bank,
            panel_type,
            additional_info
        } = req.body;
        
        // مصدر العميل (من header أو default)
        const leadSource = req.headers['x-source'] || 'website';
        
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
        
        // Calculate commission using tiers
        const commissionAmount = calculateCommission(solarData.required_kw);
        
        // حساب lead score
        const leadScore = calculateLeadScore({
            bill_amount: parseFloat(bill_amount),
            roof_area: roof_area ? parseFloat(roof_area) : 0,
            city: city,
            property_type: property_type,
            roof_availability: roof_availability,
            meter_number: meter_number
        });
        
        // جمع المعلومات الإضافية بشكل منظم (للتخزين النصي)
        let fullAdditionalInfo = '';
        if (meter_number) fullAdditionalInfo += `🔢 رقم العداد: ${meter_number}\n`;
        if (payment_method) fullAdditionalInfo += `💰 طريقة الدفع: ${payment_method}\n`;
        if (preferred_bank) fullAdditionalInfo += `🏦 البنك المختار: ${preferred_bank}\n`;
        if (panel_type) fullAdditionalInfo += `🔋 نوع اللوح: ${panel_type}\n`;
        if (additional_info) fullAdditionalInfo += `📋 معلومات إضافية: ${additional_info}\n`;
        if (roof_availability !== undefined) fullAdditionalInfo += `🏠 توفر السطح: ${roof_availability ? 'نعم' : 'لا'}\n`;
        if (roof_area) fullAdditionalInfo += `📐 مساحة السطح: ${roof_area} م²\n`;
        
        console.log(`📊 Lead data: ${name}, ${phone}, KW: ${solarData.required_kw}, Score: ${leadScore}`);
        
        // INSERT مع جميع الحقول (بما فيها الجديدة)
        const query = `
            INSERT INTO leads (
                name, phone, city, property_type, 
                bill_amount, bill_period_months, bill_season,
                roof_availability, roof_area, meter_number,
                payment_method, preferred_bank, panel_type,
                additional_info, lead_score, lead_source,
                required_kw, panels_count, commission_amount,
                status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP)
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
            roof_area ? parseFloat(roof_area) : null,
            meter_number || null,
            payment_method || null,
            preferred_bank || null,
            panel_type || null,
            fullAdditionalInfo || null,
            leadScore,
            leadSource,
            solarData.required_kw,
            solarData.panels_count,
            commissionAmount,
            'pending'
        ];
        
        const result = await db.query(query, values);
        const leadId = getFirstRow(result)?.id;
        
        // تسجيل في activity_logs
        await db.query(
            `INSERT INTO activity_logs (user_id, action, details, ip_address) 
             VALUES ($1, $2, $3, $4)`,
            [null, 'lead_created', `تم إنشاء طلب جديد من ${name} (رقم الهاتف: ${phone})`, req.ip]
        );
        
        console.log(`✅ Lead created successfully with ID: ${leadId}`);
        console.log(`   📊 Required KW: ${solarData.required_kw} kWp`);
        console.log(`   💰 Commission: ${commissionAmount} DT`);
        console.log(`   ⭐ Lead Score: ${leadScore}`);
        console.log(`   📍 Source: ${leadSource}`);
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: leadId,
            leadScore: leadScore,
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
        
        // إضافة تصنيف lead بناءً على الـ score
        let leadQuality = 'weak';
        if (lead.lead_score >= 70) leadQuality = 'hot';
        else if (lead.lead_score >= 50) leadQuality = 'warm';
        else if (lead.lead_score >= 30) leadQuality = 'medium';
        
        res.json({
            ...lead,
            lead_quality: leadQuality
        });
        
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
        const existingResult = await db.query('SELECT id, status, lead_score FROM leads WHERE id = $1', [id]);
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
        } else if (status === 'completed') {
            updateQuery += `, completed_at = CURRENT_TIMESTAMP`;
        }
        
        if (notes) {
            updateQuery += `, notes = COALESCE(notes, '') || '\n' || $${paramIndex}`;
            params.push(`[${new Date().toISOString()}] ${notes}`);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex}`;
        params.push(id);
        
        await db.query(updateQuery, params);
        
        // Add to lead history
        try {
            await db.query(
                `INSERT INTO lead_history (lead_id, action, old_status, new_status, changed_by, notes) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, 'status_updated', oldStatus, status, userId, notes]
            );
        } catch (err) {
            console.log('Note: lead_history table might not exist yet');
        }
        
        // Log activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action, details, ip_address) 
             VALUES ($1, $2, $3, $4)`,
            [userId, 'lead_status_updated', `تم تحديث حالة الطلب ${id} من ${oldStatus} إلى ${status}`, req.ip]
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
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
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
        params.push(limitNum, offset);
        
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
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
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
        
        // Add to lead history
        try {
            await db.query(
                `INSERT INTO lead_history (lead_id, action, notes, changed_by) 
                 VALUES ($1, $2, $3, $4)`,
                [id, 'note_added', notes, userId]
            );
        } catch (err) {
            console.log('Note: lead_history table might not exist yet');
        }
        
        console.log(`✅ Note added to lead ${id}`);
        res.json({ message: 'تم إضافة الملاحظة بنجاح' });
        
    } catch (error) {
        console.error('❌ Error adding lead note:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الملاحظة', error: error.message });
    }
};

// =============================================
// الحصول على إحصائيات الـ leads (للمدير)
// =============================================
exports.getLeadStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                AVG(lead_score) as avg_lead_score,
                SUM(CASE WHEN lead_score >= 70 THEN 1 ELSE 0 END) as hot_leads,
                SUM(CASE WHEN lead_score >= 50 AND lead_score < 70 THEN 1 ELSE 0 END) as warm_leads,
                COALESCE(SUM(commission_amount), 0) as total_commission
            FROM leads
        `);
        
        const stats = getFirstRow(result) || {};
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error getting lead stats:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الإحصائيات', error: error.message });
    }
};

// =============================================
// تصدير الدوال
// =============================================
module.exports = {
    calculateLead: exports.calculateLead,
    createLead: exports.createLead,
    getLead: exports.getLead,
    updateLeadStatus: exports.updateLeadStatus,
    getMyLeads: exports.getMyLeads,
    addLeadNote: exports.addLeadNote,
    getLeadStats: exports.getLeadStats
};