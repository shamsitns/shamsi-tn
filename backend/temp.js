const { initDatabase, query } = require('./config/database');

async function run() {
    await initDatabase();
    await query(`ALTER TABLE leads ADD COLUMN assigned_to INTEGER`);
    console.log('✅ Column added');
    process.exit(0);
}

run();