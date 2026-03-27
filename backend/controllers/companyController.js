const db = require('../config/database');
const bcrypt = require('bcryptjs');

// الحصول على جميع الشركات
exports.getAllCompanies = async (req, res) => {
    try {
        const [companies] = await db.query(
            'SELECT id, name, email, phone, city, description, rating, projects_count, logo, is_active FROM companies ORDER BY rating DESC'
        );
        res.json(companies || []);
    } catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على شركة محددة
exports.getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const [companies] = await db.query(
            'SELECT id, name, email, phone, city, address, description, rating, projects_count, logo FROM companies WHERE id = ?',
            [id]
        );
        
        if (!companies || companies.length === 0) {
            return res.status(404).json({ message: 'الشركة غير موجودة' });
        }
        
        res.json(companies[0]);
    } catch (error) {
        console.error('Error getting company:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// إضافة شركة جديدة (لأدمن فقط)
exports.addCompany = async (req, res) => {
    try {
        const { name, email, password, phone, city, address, description } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'الاسم، البريد الإلكتروني وكلمة المرور مطلوبة' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        await db.execute(
            `INSERT INTO companies (name, email, password, phone, city, address, description) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone || null, city || null, address || null, description || null]
        );
        
        res.status(201).json({ message: 'تم إضافة الشركة بنجاح' });
    } catch (error) {
        console.error('Error adding company:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// تحديث تقييم الشركة
exports.updateCompanyRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        
        await db.execute(
            'UPDATE companies SET rating = ? WHERE id = ?',
            [rating, id]
        );
        
        res.json({ message: 'تم تحديث التقييم بنجاح' });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};

// الحصول على طلبات شركة محددة
exports.getCompanyLeads = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [leads] = await db.query(`
            SELECT l.*, lc.price, lc.notes, lc.assigned_at
            FROM leads l
            JOIN lead_companies lc ON l.id = lc.lead_id
            WHERE lc.company_id = ?
            ORDER BY lc.assigned_at DESC
        `, [id]);
        
        res.json(leads || []);
    } catch (error) {
        console.error('Error getting company leads:', error);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
};