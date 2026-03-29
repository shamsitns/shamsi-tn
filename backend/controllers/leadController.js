const db = require('../config/database');
const { calculateSolarSystem, validateLeadEligibility } = require('../utils/solarCalculator');

// حساب النظام الشمسي فقط (بدون حفظ في قاعدة البيانات)
exports.calculateLead = async (req, res) => {
    try {
        console.log('📝 Calculation request (no save):', req.body);
        
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
        
        if (!user_name || !phone || !city || !monthly_bill) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، المدينة، والفاتورة مطلوبة']
            });
        }
        
        const solarData = calculateSolarSystem(
            parseFloat(monthly_bill),
            monthly_consumption ? parseFloat(monthly_consumption) : null,
            city,
            roof_direction || 'جنوب',
            shading || 'لا يوجد',
            property_type || 'house'
        );
        
        console.log('📊 Solar calculation result (not saved):', solarData);
        
        res.status(200).json({
            message: 'تم حساب النظام الشمسي بنجاح',
            solarData
        });
        
    } catch (error) {
        console.error('❌ Error calculating solar system:', error);
        res.status(500).json({ 
            message: 'حدث خطأ في حساب النظام الشمسي',
            error: error.message 
        });
    }
};

// إنشاء طلب جديد (حفظ في قاعدة البيانات)
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
        
        if (!user_name || !phone || !city || !monthly_bill) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، المدينة، والفاتورة مطلوبة']
            });
        }
        
        const solarData = calculateSolarSystem(
            parseFloat(monthly_bill),
            monthly_consumption ? parseFloat(monthly_consumption) : null,
            city,
            roof_direction || 'جنوب',
            shading || 'لا يوجد',
            property_type || 'house'
        );
        
        console.log('📊 Solar calculation result:', solarData);
        
        const query = `
            INSERT INTO leads (
                user_name, phone, city, property_type, payment_method,
                monthly_bill, monthly_consumption, meter_owner,
                roof_area, roof_direction, shading,
                required_kw, estimated_price, panels, panel_power,
                inverter_power, annual_production, annual_savings, 
                payback_years, commission, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
            (solarData.requiredKw * 150),  // العمولة: 150 دينار لكل كيلوواط
            'new'
        ];
        
        await db.query(query, values);
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
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
        
        const result = await db.query('SELECT * FROM leads WHERE id = $1', [id]);
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
            query += ' WHERE status = $1';
            queryParams.push(status);
            query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
            queryParams.push(parseInt(limit), parseInt(offset));
        } else {
            query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            queryParams.push(parseInt(limit), parseInt(offset));
        }
        
        const result = await db.query(query, queryParams);
        const leads = result.rows || result;
        
        let countQuery = 'SELECT COUNT(*) as total FROM leads';
        const countParams = [];
        
        if (status && status !== 'all') {
            countQuery += ' WHERE status = $1';
            countParams.push(status);
        }
        
        const countResultRaw = await db.query(countQuery, countParams);
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
        
        await db.query(
            'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, leadId]
        );
        
        res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
        
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};