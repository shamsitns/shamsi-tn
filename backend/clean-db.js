const db = require('./config/database');

async function cleanDatabase() {
  console.log('🧹 Cleaning test data...');

  try {
    // حذف كل الـ leads التجريبية
    await db.query(`DELETE FROM leads`);
    console.log('✅ All leads deleted');

    // حذف كل الشركات التجريبية
    await db.query(`DELETE FROM companies`);
    console.log('✅ All companies deleted');

    // حذف كل المديرين التجريبيين
    await db.query(`DELETE FROM managers`);
    console.log('✅ All managers deleted');

    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  }
}

cleanDatabase();