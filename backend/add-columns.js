const db = require('./config/database');

async function addColumns() {
    console.log('🔧 Starting database migration...');
    
    const columnsToAdd = [
        { name: 'company_id', type: 'INTEGER' },
        { name: 'panel_recommendation', type: 'TEXT' },
        { name: 'panel_brand', type: 'TEXT' },
        { name: 'assigned_to_company', type: 'TEXT DEFAULT NULL' }
    ];
    
    for (const col of columnsToAdd) {
        try {
            await db.execute(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Added column: ${col.name}`);
        } catch (err) {
            if (err.message.includes('duplicate column')) {
                console.log(`ℹ️ Column ${col.name} already exists`);
            } else {
                console.log(`⚠️ Could not add ${col.name}: ${err.message}`);
            }
        }
    }
    
    console.log('✅ Migration completed');
}

addColumns();