const { initDatabase, query } = require('./config/database');

async function addNotesColumn() {
    console.log('🔧 Adding notes column to manager_assignments...');
    
    try {
        await initDatabase();
        console.log('✅ Database connected');

        // إضافة عمود notes
        try {
            await query(`ALTER TABLE manager_assignments ADD COLUMN notes TEXT`);
            console.log('✅ Column notes added to manager_assignments');
        } catch(e) {
            if (e.message.includes('duplicate') || e.message.includes('exists')) {
                console.log('⚠️ Column notes already exists');
            } else {
                console.log('⚠️ Error adding notes column:', e.message);
            }
        }

        // التحقق من الأعمدة
        const result = await query(`PRAGMA table_info(manager_assignments)`);
        const columns = (result.rows || result).map(col => col.name);
        console.log('📋 Columns in manager_assignments:', columns);
        
        console.log('✅ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

addNotesColumn();