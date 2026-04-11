const db = require('../config/database');
const { calculateSolarSystem } = require('../utils/solarCalculator');
const { COMMISSION_PER_KW, COMMISSION_TIERS } = require('../config/commission');
const { uploadImage, deleteImage, FOLDERS, validateImage, getOptimizedUrl } = require('../utils/imagekit');

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
    
    if (leadData.bill_amount > 500) score += 30;
    else if (leadData.bill_amount > 300) score += 20;
    else if (leadData.bill_amount > 150) score += 10;
    else if (leadData.bill_amount > 100) score += 5;
    
    if (leadData.roof_area && leadData.roof_area > 100) score += 20;
    else if (leadData.roof_area && leadData.roof_area > 50) score += 10;
    else if (leadData.roof_area && leadData.roof_area > 30) score += 5;
    
    const highRadiationCities = ['قبلي', 'تطاوين', 'مدنين', 'قفصة', 'صفاقس', 'القيروان'];
    if (highRadiationCities.includes(leadData.city)) score += 15;
    
    const mediumRadiationCities = ['تونس', 'سوسة', 'المنستير', 'نابل', 'بنزرت'];
    if (mediumRadiationCities.includes(leadData.city)) score += 10;
    
    if (leadData.property_type === 'farm') score += 15;
    if (leadData.property_type === 'house') score += 10;
    if (leadData.property_type === 'commercial') score += 8;
    
    if (leadData.roof_availability === true) score += 10;
    if (leadData.meter_number) score += 5;
    
    return Math.min(score, 100);
};

// =============================================
// حساب العمولة حسب القدرة
// =============================================
const calculateCommission = (requiredKw) => {
    const tier = COMMISSION_TIERS.find(t => 
        requiredKw >= t.minKw && requiredKw < t.maxKw
    );
    
    if (tier) {
        return requiredKw * tier.rate;
    }
    return requiredKw * COMMISSION_PER_KW;
};

// =============================================
// حساب النظام الشمسي فقط (بدون حفظ)
// =============================================
exports.calculateLead = async (req, res) => {
    try {
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
// إنشاء طلب جديد (حفظ) - مع جميع المعلومات وصورة الفاتورة
// =============================================
exports.createLead = async (req, res) => {
    try {
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
            additional_info,
            // ✅ الحقول الجديدة من الحاسبة
            roof_type,
            installation_timeline,
            required_kw,          // من الحاسبة (قد يختلف عن solarData.required_kw)
            panels_count,
            annual_production,
            annual_savings,
            monthly_savings,
            co2_saved,
            solar_score,
            coverage_percent,
            // ✅ صورة الفاتورة
            invoiceImage
        } = req.body;
        
        const leadSource = req.headers['x-source'] || 'website';
        const userId = req.user?.id || null;
        
        if (!name || !phone || !bill_amount) {
            return res.status(400).json({ 
                message: 'البيانات غير كاملة',
                errors: ['الاسم، الهاتف، وقيمة الفاتورة مطلوبة']
            });
        }
        
        // حساب النظام باستخدام الخادم (كاحتياطي، لكننا سنستخدم القيم المرسلة إذا وجدت)
        const solarData = calculateSolarSystem(
            parseFloat(bill_amount),
            parseInt(bill_period_months) || 60,
            bill_season || 'spring',
            property_type || 'house'
        );
        
        // استخدام القيم المرسلة من الحاسبة إذا كانت موجودة، وإلا استخدم القيم المحسوبة من الخادم
        const finalRequiredKw = required_kw !== undefined ? required_kw : solarData.required_kw;
        const finalPanelsCount = panels_count !== undefined ? panels_count : solarData.panels_count;
        const finalAnnualProduction = annual_production !== undefined ? annual_production : solarData.annual_production;
        const finalAnnualSavings = annual_savings !== undefined ? annual_savings : solarData.annual_savings;
        const finalMonthlySavings = monthly_savings !== undefined ? monthly_savings : Math.round(finalAnnualSavings / 12);
        const finalCo2Saved = co2_saved !== undefined ? co2_saved : solarData.co2_saved;
        const finalSolarScore = solar_score !== undefined ? solar_score : null;
        const finalCoveragePercent = coverage_percent !== undefined ? coverage_percent : null;
        
        const commissionAmount = calculateCommission(finalRequiredKw);
        
        const leadScore = calculateLeadScore({
            bill_amount: parseFloat(bill_amount),
            roof_area: roof_area ? parseFloat(roof_area) : 0,
            city: city,
            property_type: property_type,
            roof_availability: roof_availability,
            meter_number: meter_number
        });
        
        // ✅ رفع صورة الفاتورة إلى ImageKit إذا وجدت
        let invoiceImageUrl = null;
        let invoiceImageFileId = null;
        
        if (invoiceImage) {
            const validation = validateImage(invoiceImage, 5);
            if (!validation.valid) {
                return res.status(400).json({ message: validation.error });
            }
            
            const uploadResult = await uploadImage(
                invoiceImage,
                `invoice_${Date.now()}_${userId || 'guest'}.jpg`,
                FOLDERS.INVOICES,
                { tags: ['invoice', `lead_${Date.now()}`] }
            );
            
            if (uploadResult.success) {
                invoiceImageUrl = uploadResult.url;
                invoiceImageFileId = uploadResult.fileId;
                console.log(`✅ Invoice image uploaded: ${invoiceImageUrl}`);
            } else {
                console.error('❌ Failed to upload invoice image:', uploadResult.error);
                // لا نمنع إنشاء الطلب إذا فشل رفع الصورة، فقط نسجل الخطأ
            }
        }
        
        let fullAdditionalInfo = '';
        if (meter_number) fullAdditionalInfo += `🔢 رقم العداد: ${meter_number}\n`;
        if (payment_method) fullAdditionalInfo += `💰 طريقة الدفع: ${payment_method}\n`;
        if (preferred_bank) fullAdditionalInfo += `🏦 البنك المختار: ${preferred_bank}\n`;
        if (panel_type) fullAdditionalInfo += `🔋 نوع اللوح: ${panel_type}\n`;
        if (additional_info) fullAdditionalInfo += `📋 معلومات إضافية: ${additional_info}\n`;
        if (roof_availability !== undefined) fullAdditionalInfo += `🏠 توفر السطح: ${roof_availability ? 'نعم' : 'لا'}\n`;
        if (roof_area) fullAdditionalInfo += `📐 مساحة السطح: ${roof_area} م²\n`;
        if (roof_type) fullAdditionalInfo += `🏗️ نوع السطح: ${roof_type === 'terrace' ? 'سطح مسطح' : roof_type === 'inclined' ? 'سطح مائل' : 'أرض / حديقة'}\n`;
        if (installation_timeline) {
            const timelineText = installation_timeline === '<3' ? 'أقل من 3 أشهر' : installation_timeline === '3-6' ? '3 - 6 أشهر' : 'أكثر من 6 أشهر';
            fullAdditionalInfo += `⏱️ خطة التركيب: ${timelineText}\n`;
        }
        
        console.log(`📊 Lead data: ${name}, ${phone}, KW: ${finalRequiredKw}, Score: ${leadScore}`);
        
        // ✅ INSERT مع جميع الأعمدة (بما فيها أعمدة الصور)
        const query = `
            INSERT INTO leads (
                name, phone, city, property_type, 
                bill_amount, bill_period_months, bill_season,
                roof_availability, roof_area, meter_number,
                payment_method, preferred_bank, panel_type,
                lead_source, lead_score,
                additional_info, required_kw, panels_count, commission_amount,
                roof_type, installation_timeline,
                annual_production, annual_savings, monthly_savings,
                co2_saved, solar_score, coverage_percent,
                invoice_image_url, invoice_image_file_id,
                status, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, CURRENT_TIMESTAMP)
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
            leadSource,
            leadScore,
            fullAdditionalInfo || null,
            finalRequiredKw,
            finalPanelsCount,
            commissionAmount,
            roof_type || null,
            installation_timeline || null,
            finalAnnualProduction,
            finalAnnualSavings,
            finalMonthlySavings,
            finalCo2Saved,
            finalSolarScore,
            finalCoveragePercent,
            invoiceImageUrl,
            invoiceImageFileId,
            'pending',
            userId
        ];
        
        const result = await db.query(query, values);
        const leadId = getFirstRow(result)?.id;
        
        await db.query(
            `INSERT INTO activity_logs (user_id, action, details, ip_address) 
             VALUES ($1, $2, $3, $4)`,
            [userId, 'lead_created', `تم إنشاء طلب جديد من ${name} (رقم الهاتف: ${phone})`, req.ip]
        );
        
        console.log(`✅ Lead created successfully with ID: ${leadId}`);
        console.log(`   📊 Required KW: ${finalRequiredKw} kWp`);
        console.log(`   💰 Commission: ${commissionAmount} DT`);
        console.log(`   ⭐ Lead Score: ${leadScore}`);
        console.log(`   📍 Source: ${leadSource}`);
        console.log(`   👤 Created by: ${userId}`);
        console.log(`   🏗️ Roof type: ${roof_type || 'غير محدد'}`);
        console.log(`   ⏱️ Installation timeline: ${installation_timeline || 'غير محدد'}`);
        console.log(`   🖼️ Invoice image: ${invoiceImageUrl ? 'تم الرفع' : 'لا توجد صورة'}`);
        
        res.status(201).json({
            message: 'تم إرسال الطلب بنجاح',
            leadId: leadId,
            leadScore: leadScore,
            invoiceImageUrl: invoiceImageUrl,
            solarData: {
                required_kw: finalRequiredKw,
                panels_count: finalPanelsCount,
                annual_production: finalAnnualProduction,
                annual_savings: finalAnnualSavings,
                co2_saved: finalCo2Saved,
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
// حذف طلب (مع حذف الصورة المرتبطة)
// =============================================
exports.deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        
        // جلب معلومات الصورة قبل حذف الطلب
        const leadResult = await db.query(
            'SELECT invoice_image_file_id FROM leads WHERE id = $1',
            [id]
        );
        const lead = getFirstRow(leadResult);
        
        if (!lead) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        // حذف الصورة من ImageKit إذا وجدت
        if (lead.invoice_image_file_id) {
            const deleteResult = await deleteImage(lead.invoice_image_file_id);
            if (deleteResult.success) {
                console.log(`✅ Deleted invoice image for lead ${id}`);
            } else {
                console.error(`❌ Failed to delete invoice image for lead ${id}:`, deleteResult.error);
            }
        }
        
        // حذف الطلب من قاعدة البيانات
        await db.query('DELETE FROM leads WHERE id = $1', [id]);
        
        console.log(`✅ Lead ${id} deleted successfully`);
        res.json({ message: 'تم حذف الطلب بنجاح' });
        
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب', error: error.message });
    }
};

// =============================================
// الحصول على صورة فاتورة محسنة
// =============================================
exports.getInvoiceImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { width = 800, quality = 80 } = req.query;
        
        const result = await db.query(
            'SELECT invoice_image_url, invoice_image_file_id FROM leads WHERE id = $1',
            [id]
        );
        
        const lead = getFirstRow(result);
        if (!lead?.invoice_image_url) {
            return res.status(404).json({ message: 'لا توجد صورة فاتورة لهذا الطلب' });
        }
        
        const optimizedUrl = getOptimizedUrl(lead.invoice_image_url, {
            width: parseInt(width),
            quality: parseInt(quality)
        });
        
        res.json({ 
            url: optimizedUrl,
            fileId: lead.invoice_image_file_id
        });
        
    } catch (error) {
        console.error('❌ Error getting invoice image:', error);
        res.status(500).json({ message: 'حدث خطأ في جلب الصورة', error: error.message });
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
// تحديث حالة الطلب
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
        
        const existingResult = await db.query('SELECT id, status FROM leads WHERE id = $1', [id]);
        const existing = getFirstRow(existingResult);
        
        if (!existing) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        const oldStatus = existing.status;
        
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
            updateQuery += `, notes = COALESCE(notes, '') || '\n' || $${paramIndex}`;
            params.push(`[${new Date().toISOString()}] ${notes}`);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex}`;
        params.push(id);
        
        await db.query(updateQuery, params);
        
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
        
        const existingResult = await db.query('SELECT id FROM leads WHERE id = $1', [id]);
        const existing = getRows(existingResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
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
        console.error('❌ Error adding note:', error);
        res.status(500).json({ message: 'حدث خطأ في إضافة الملاحظة', error: error.message });
    }
};

// =============================================
// إرسال الطلب لمدير العمليات
// =============================================
exports.sendToOperations = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = req.user?.id;
        
        const existingResult = await db.query('SELECT id, status FROM leads WHERE id = $1', [id]);
        const existing = getFirstRow(existingResult);
        
        if (!existing) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }
        
        await db.query(
            `UPDATE leads 
             SET status = 'sent_to_operations',
                 sent_to_operations_by = $1,
                 sent_to_operations_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [userId, id]
        );
        
        console.log(`✅ Lead ${id} sent to operations`);
        res.json({ message: 'تم إرسال الطلب لمدير العمليات بنجاح', leadId: id });
        
    } catch (error) {
        console.error('❌ Error sending to operations:', error);
        res.status(500).json({ message: 'حدث خطأ في إرسال الطلب', error: error.message });
    }
};

// =============================================
// تصدير الدوال
// =============================================
module.exports = {
    calculateLead: exports.calculateLead,
    createLead: exports.createLead,
    deleteLead: exports.deleteLead,
    getInvoiceImage: exports.getInvoiceImage,
    getLead: exports.getLead,
    updateLeadStatus: exports.updateLeadStatus,
    getMyLeads: exports.getMyLeads,
    addLeadNote: exports.addLeadNote,
    sendToOperations: exports.sendToOperations
};