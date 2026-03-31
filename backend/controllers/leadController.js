const db = require('../config/database');
const { calculateSolarSystem, validateLeadEligibility } = require('../utils/solarCalculator');

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
            bill_period,
            bill_season,
            meter_number,
            bill_value,
            roof_area,
            payment_method
        } = req.body;
        
        if (!name || !phone || !city || !bill_value) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، المدينة، والفاتورة مطلوبة']
            });
        }
        
        const solarData = calculateSolarSystem(
            parseFloat(bill_value),
            parseInt(bill_period) || 60,
            bill_season || 'spring',
            property_type || 'house',
            payment_method || 'cash',
            roof_area ? parseFloat(roof_area) : null
        );
        
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
// إنشاء طلب جديد (حفظ)
// =============================================
exports.createLead = async (req, res) => {
    try {
        console.log('📝 Creating lead:', req.body);
        
        const {
            name,
            phone,
            city,
            property_type,
            bill_period,
            bill_season,
            meter_number,
            bill_value,
            roof_area,
            payment_method
        } = req.body;
        
        if (!name || !phone || !city || !bill_value) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، المدينة، والفاتورة مطلوبة']
            });
        }
        
        const solarData = calculateSolarSystem(
            parseFloat(bill_value),
            parseInt(bill_period) || 60,
            bill_season || 'spring',
            property_type || 'house',
            payment_method || 'cash',
            roof_area ? parseFloat(roof_area) : null
        );
        
        const query = `
            INSERT INTO leads (
                name, phone, city, property_type, bill_period, bill_season, meter_number,
                bill_value, roof_area, payment_method, recommended_system, panels,
                annual_production, annual_savings, estimated_price, commission,
                monthly_installment, co2_saved, required_roof_area, adjusted_annual_consumption,
                status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        
        const values = [
            name,
            phone,
            city,
            property_type || 'house',
            parseInt(bill_period) || 60,
            bill_season || 'spring',
            meter_number || null,
            parseFloat(bill_value),
            roof_area ? parseFloat(roof_area) : null,
            payment_method || 'cash',
            solarData.recommendedKw,
            solarData.panels,
            solarData.annualProduction,
            solarData.annualSavings,
            solarData.estimatedPrice,
            solarData.commission,
            solarData.monthlyInstallment,
            solarData.co2Saved,
            solarData.requiredRoofArea,
            solarData.adjustedAnnualConsumption,
            'new'
        ];
        
        const result = await db.query(query, values);
        const leadId = result.rows[0]?.id;
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: leadId,
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

// =============================================
// الحصول على طلب محدد
// =============================================
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