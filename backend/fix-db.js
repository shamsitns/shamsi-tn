const { initDatabase, query } = require('./config/database');

async function fixDatabase() {
    await initDatabase();
    
    try {
        await query(`ALTER TABLE manager_assignments ADD COLUMN notes TEXT`);
        console.log('✅ Column notes added to manager_assignments');
    } catch (e) {
        console.log('⚠️ Column notes already exists or error:', e.message);
    }
    
    try {
        await query(`ALTER TABLE leads ADD COLUMN assigned_to INTEGER REFERENCES users(id)`);
        console.log('✅ Column assigned_to added to leads');
    } catch (e) {
        console.log('⚠️ Column assigned_to already exists or error:', e.message);
    }
    
    console.log('✅ Database fix completed');
    process.exit(0);
}

fixDatabase();