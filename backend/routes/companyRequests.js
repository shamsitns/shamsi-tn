const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// =============================================
// POST /api/company-requests - تسجيل شركة جديدة
// =============================================
router.post('/', async (req, res) => {
    const { company_name, contact_name, phone, email, city, address, message } = req.body;
    
    // Validation
    if (!company_name || !contact_name || !phone || !email || !city) {
        return res.status(400).json({ 
            success: false,
            message: 'جميع الحقول المطلوبة يجب تعبئتها' 
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false,
            message: 'البريد الإلكتروني غير صحيح' 
        });
    }
    
    // Validate phone (Tunisian format)
    const phoneRegex = /^[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
            success: false,
            message: 'رقم الهاتف يجب أن يكون 8 أرقام' 
        });
    }
    
    try {
        const db = getDb();
        const requestId = uuidv4();
        
        // Check if company already exists
        const existingCompany = await db.query(
            'SELECT id FROM companies WHERE email = $1 OR phone = $2 LIMIT 1',
            [email, phone]
        );
        
        const existingRows = existingCompany.rows || existingCompany;
        if (existingRows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'هذه الشركة مسجلة بالفعل في المنصة' 
            });
        }
        
        // Check if there's a pending request
        const existingRequest = await db.query(
            "SELECT id FROM company_requests WHERE email = $1 AND status = 'pending' LIMIT 1",
            [email]
        );
        
        const existingRequestRows = existingRequest.rows || existingRequest;
        if (existingRequestRows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'لديك طلب قيد المراجعة بالفعل، سنتواصل معك قريباً' 
            });
        }
        
        // Insert company request
        const result = await db.query(
            `INSERT INTO company_requests (
                request_id, company_name, contact_name, phone, email, 
                city, address, message, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
            RETURNING id, request_id`,
            [requestId, company_name, contact_name, phone, email, city, address || '', message || '']
        );
        
        const newRequest = (result.rows || result)[0];
        
        // Optional: Send notification to admin (you can add email/WhatsApp here)
        console.log(`📋 New company request received: ${company_name} (${email})`);
        
        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح! سنتواصل معكم خلال 48 ساعة',
            data: {
                request_id: newRequest.request_id,
                company_name: company_name,
                status: 'pending'
            }
        });
        
    } catch (error) {
        console.error('Error creating company request:', error);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' 
        });
    }
});

// =============================================
// GET /api/company-requests - جلب جميع الطلبات (للمدير فقط)
// =============================================
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const result = await db.query(
            `SELECT id, request_id, company_name, contact_name, phone, email, 
                    city, address, message, status, created_at, reviewed_at, notes
             FROM company_requests 
             ORDER BY created_at DESC`
        );
        
        const requests = result.rows || result;
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
        
    } catch (error) {
        console.error('Error fetching company requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في جلب البيانات' 
        });
    }
});

// =============================================
// GET /api/company-requests/:id - جلب طلب محدد
// =============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const db = getDb();
        const result = await db.query(
            'SELECT * FROM company_requests WHERE id = $1 OR request_id = $1',
            [id]
        );
        
        const request = (result.rows || result)[0];
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'الطلب غير موجود' 
            });
        }
        
        res.json({
            success: true,
            data: request
        });
        
    } catch (error) {
        console.error('Error fetching company request:', error);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في جلب البيانات' 
        });
    }
});

// =============================================
// PATCH /api/company-requests/:id/status - تحديث حالة الطلب (للمدير فقط)
// =============================================
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected', 'contacted'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false,
            message: 'حالة غير صحيحة' 
        });
    }
    
    try {
        const db = getDb();
        const result = await db.query(
            `UPDATE company_requests 
             SET status = $1, notes = $2, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $3 OR request_id = $3
             RETURNING id, request_id, company_name, status`,
            [status, notes || null, id]
        );
        
        const updated = (result.rows || result)[0];
        
        if (!updated) {
            return res.status(404).json({ 
                success: false,
                message: 'الطلب غير موجود' 
            });
        }
        
        res.json({
            success: true,
            message: `تم تحديث حالة الطلب إلى ${status}`,
            data: updated
        });
        
    } catch (error) {
        console.error('Error updating company request:', error);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في تحديث البيانات' 
        });
    }
});

// =============================================
// DELETE /api/company-requests/:id - حذف طلب (للمدير فقط)
// =============================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const db = getDb();
        const result = await db.query(
            'DELETE FROM company_requests WHERE id = $1 OR request_id = $1 RETURNING id',
            [id]
        );
        
        const deleted = (result.rows || result)[0];
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                message: 'الطلب غير موجود' 
            });
        }
        
        res.json({
            success: true,
            message: 'تم حذف الطلب بنجاح'
        });
        
    } catch (error) {
        console.error('Error deleting company request:', error);
        res.status(500).json({ 
            success: false,
            message: 'حدث خطأ في حذف البيانات' 
        });
    }
});

module.exports = router;