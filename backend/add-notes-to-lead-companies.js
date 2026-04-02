const { initDatabase, query } = require('./config/database');

async function addNotesColumn() {
    console.log('🔧 Adding notes column to lead_companies...');
    
    try {
        await initDatabase();
        console.log('✅ Database connected');

        // إضافة عمود notes
        try {
            await query(`ALTER TABLE lead_companies ADD COLUMN notes TEXT`);
            console.log('✅ Column notes added to lead_companies');
        } catch(e) {
            if (e.message.includes('duplicate') || e.message.includes('exists')) {
                console.log('⚠️ Column notes already exists');
            } else {
                console.log('⚠️ Error adding notes column:', e.message);
            }
        }

        // التحقق من الأعمدة
        const result = await query(`PRAGMA table_info(lead_companies)`);
        const columns = (result.rows || result).map(col => col.name);
        console.log('📋 Columns in lead_companies:', columns);
        
        console.log('✅ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

addNotesColumn();