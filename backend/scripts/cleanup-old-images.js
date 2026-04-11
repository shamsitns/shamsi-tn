const { deleteMultipleImages } = require('../utils/imagekit');
const db = require('../config/database');

async function cleanupOldImages() {
    console.log('🧹 Starting image cleanup...');
    
    try {
        // جلب الطلبات المكتملة أو الملغاة منذ أكثر من 6 أشهر ولديها صور
        const result = await db.query(`
            SELECT id, invoice_image_file_id, status, completed_at 
            FROM leads 
            WHERE status IN ('completed', 'cancelled')
            AND completed_at < NOW() - INTERVAL '6 months'
            AND invoice_image_file_id IS NOT NULL
        `);
        
        const leadsToClean = result.rows;
        
        if (leadsToClean.length === 0) {
            console.log('✅ No old images to clean up');
            return;
        }
        
        const fileIds = leadsToClean.map(row => row.invoice_image_file_id);
        
        console.log(`📊 Found ${leadsToClean.length} old leads with images`);
        
        // حذف الصور من ImageKit
        const deleteResults = await deleteMultipleImages(fileIds);
        
        const successfulDeletes = deleteResults.filter(r => r.success).length;
        const failedDeletes = deleteResults.filter(r => !r.success).length;
        
        // تحديث قاعدة البيانات لإزالة references
        await db.query(`
            UPDATE leads 
            SET invoice_image_url = NULL, 
                invoice_image_file_id = NULL 
            WHERE id = ANY($1)
        `, [leadsToClean.map(l => l.id)]);
        
        console.log(`✅ Cleanup completed: ${successfulDeletes} deleted, ${failedDeletes} failed`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// تنفيذ التنظيف
cleanupOldImages();