const db = require('./config/database');

async function addColumns() {
  console.log('🔧 Adding new columns if not exist...');

  try {
    // مثال: إضافة عمود panel_brand للـ leads
    await db.query(`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS panel_brand VARCHAR(100)
    `);
    console.log('✅ Column panel_brand added to leads (if not exists)');

    await db.query(`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS panel_recommendation VARCHAR(100)
    `);
    console.log('✅ Column panel_recommendation added to leads (if not exists)');

    console.log('✅ All columns checked/added');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
  }
}

addColumns();