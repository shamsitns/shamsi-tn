const db = require('../config/database');
const { calculateSolarSystem, validateLeadEligibility } = require('../utils/solarCalculator');

// إنشاء طلب جديد
exports.createLead = async (req, res) => {
    try {
        console.log('📝 Received lead data:', req.body);
        
        const {
            user_name,
            phone,
            city,
            property_type,
            payment_method,
            monthly_bill,
            monthly_consumption,
            meter_owner,
            roof_area,
            roof_direction,
            shading
        } = req.body;
        
        // التحقق من البيانات المطلوبة
        if (!user_name || !phone || !city || !monthly_bill) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، المدينة، والفاتورة مطلوبة']
            });
        }
        
        // حساب النظام الشمسي
        const solarData = calculateSolarSystem(
            parseFloat(monthly_bill),
            monthly_consumption ? parseFloat(monthly_consumption) : null,
            city,
            roof_direction || 'جنوب',
            shading || 'لا يوجد',
            property_type || 'house'
        );
        
        console.log('📊 Solar calculation result:', solarData);
        
        // إدخال البيانات في قاعدة البيانات (صيغة PostgreSQL)
        const query = `
            INSERT INTO leads (
                user_name, phone, city, property_type, payment_method,
                monthly_bill, monthly_consumption, meter_owner,
                roof_area, roof_direction, shading,
                required_kw, estimated_price, panels, panel_power,
                inverter_power, annual_production, annual_savings, 
                payback_years, commission, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING id
        `;
        
        const values = [
            user_name,
            phone,
            city,
            property_type || 'house',
            payment_method || 'cash',
            parseFloat(monthly_bill),
            monthly_consumption ? parseFloat(monthly_consumption) : null,
            meter_owner ? 1 : 0,
            roof_area ? parseFloat(roof_area) : null,
            roof_direction || 'جنوب',
            shading || 'لا يوجد',
            solarData.requiredKw,
            solarData.estimatedPrice,
            solarData.panels,
            solarData.panelPower,
            solarData.inverterPower,
            solarData.annualProduction,
            solarData.annualSavings,
            solarData.paybackYears,
            solarData.commission,
            'new'
        ];
        
        const result = await db.query(query, values);
        const insertId = result.rows[0]?.id;
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: insertId,
            solarData
        });
        
    } catch (error) {
        console.error('❌ Error creating lead:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في الخادم',
            error: error.message 
        });
    }
};
// الحصول على طلب محدد
exports.getLead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'SELECT * FROM leads WHERE id = ?',
            [id]
        );
        const leads = result.rows || result;
        
        if (!leads || leads.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        res.json(leads[0]);
        
    } catch (error) {
        console.error('Error getting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على جميع الطلبات
exports.getAllLeads = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM leads';
        const queryParams = [];
        
        if (status && status !== 'all') {
            query += ' WHERE status = ?';
            queryParams.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, queryParams);
        const leads = result.rows || result;
        
        let countQuery = 'SELECT COUNT(*) as total FROM leads';
        if (status && status !== 'all') {
            countQuery += ' WHERE status = ?';
        }
        const countResultRaw = await db.query(
            countQuery,
            (status && status !== 'all') ? [status] : []
        );
        const countResult = countResultRaw.rows || countResultRaw;
        
        res.json({
            leads: leads || [],
            total: countResult[0]?.total || 0,
            page: parseInt(page),
            totalPages: Math.ceil((countResult[0]?.total || 0) / limit)
        });
        
    } catch (error) {
        console.error('Error getting leads:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// تحديث حالة الطلب
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status } = req.body;
        
        await db.execute(
            'UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, leadId]
        );
        
        res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
        
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};