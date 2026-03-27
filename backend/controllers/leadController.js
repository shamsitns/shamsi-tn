const db = require('../config/database');
const pool = require('../config/database');
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
            meter_number,
            roof_area,
            roof_direction,
            roof_type,
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
            monthly_bill,
            monthly_consumption,
            city,
            roof_direction || 'جنوب',
            shading || 'لا يوجد',
            property_type || 'house'
        );
        
        // التحقق من أهلية العميل
        const eligibility = validateLeadEligibility(
            monthly_bill,
            roof_area,
            solarData.requiredRoofArea
        );
        
        // إدخال البيانات في قاعدة البيانات
        const query = `
            INSERT INTO leads (
                user_name, phone, city, property_type, payment_method,
                monthly_bill, monthly_consumption, meter_owner, meter_number,
                roof_area, roof_direction, roof_type, shading,
                required_kw, estimated_price, panels, panel_power, inverter_power,
                annual_production, annual_savings, payback_years, commission,
                co2_saved, required_roof_area, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            meter_number || null,
            roof_area ? parseFloat(roof_area) : null,
            roof_direction || 'جنوب',
            roof_type || 'مسطح',
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
            solarData.co2Saved,
            solarData.requiredRoofArea,
            'new'
        ];
        
        const [result] = await pool.execute(query, values);
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: result.insertId,
            solarData,
            eligibility: {
                warnings: eligibility.warnings || []
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

// الحصول على طلب محدد
exports.getLead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [leads] = await pool.query(
            'SELECT * FROM leads WHERE id = ?',
            [id]
        );
        
        if (leads.length === 0 || !leads[0]) {
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
        
        if (status) {
            query += ' WHERE status = ?';
            queryParams.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [leads] = await pool.query(query, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM leads';
        if (status) {
            countQuery += ' WHERE status = ?';
        }
        const [countResult] = await pool.query(
            countQuery,
            status ? [status] : []
        );
        
        res.json({
            leads,
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
        const { status, notes } = req.body;
        
        await pool.execute(
            'UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, leadId]
        );
        
        res.json({ message: 'تم تحديث حالة الطلب بنجاح' });
        
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على إحصائيات الطلبات
exports.getLeadStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status = 'approved_by_admin' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'sent_to_manager' THEN 1 ELSE 0 END) as sent_to_manager,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(required_kw) as total_kw,
                SUM(commission) as total_commission
            FROM leads
        `);
        
        res.json(stats[0] || {
            total: 0, new: 0, approved: 0, sent_to_manager: 0, completed: 0, rejected: 0,
            total_kw: 0, total_commission: 0
        });
        
    } catch (error) {
        console.error('Error getting lead stats:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};