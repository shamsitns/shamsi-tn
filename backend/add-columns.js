const { initDatabase, query, getDbType } = require('./config/database');

async function addColumns() {
  console.log('🔧 Adding new columns if not exist...');
  console.log('📊 Database type:', getDbType());

  try {
    // Initialize database first
    await initDatabase();

    // =============================================
    // إضافة أعمدة جديدة لجدول leads
    // =============================================

    // إضافة عمود panel_brand
    try {
      await query(`
        ALTER TABLE leads
        ADD COLUMN panel_brand VARCHAR(100)
      `);
      console.log('✅ Column panel_brand added to leads (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column panel_brand already exists');
      } else {
        console.log('⚠️ Could not add panel_brand:', error.message);
      }
    }

    // إضافة عمود panel_recommendation
    try {
      await query(`
        ALTER TABLE leads
        ADD COLUMN panel_recommendation VARCHAR(100)
      `);
      console.log('✅ Column panel_recommendation added to leads (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column panel_recommendation already exists');
      } else {
        console.log('⚠️ Could not add panel_recommendation:', error.message);
      }
    }

    // إضافة عمود financing_method (طريقة التمويل)
    try {
      await query(`
        ALTER TABLE leads
        ADD COLUMN financing_method VARCHAR(50)
      `);
      console.log('✅ Column financing_method added to leads (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column financing_method already exists');
      } else {
        console.log('⚠️ Could not add financing_method:', error.message);
      }
    }

    // إضافة عمود prosol_eligible (هل مؤهل لـ PROSOL)
    try {
      await query(`
        ALTER TABLE leads
        ADD COLUMN prosol_eligible BOOLEAN DEFAULT false
      `);
      console.log('✅ Column prosol_eligible added to leads (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column prosol_eligible already exists');
      } else {
        console.log('⚠️ Could not add prosol_eligible:', error.message);
      }
    }

    // إضافة عمود visit_scheduled (هل تم تحديد موعد زيارة)
    try {
      await query(`
        ALTER TABLE leads
        ADD COLUMN visit_scheduled TIMESTAMP
      `);
      console.log('✅ Column visit_scheduled added to leads (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column visit_scheduled already exists');
      } else {
        console.log('⚠️ Could not add visit_scheduled:', error.message);
      }
    }

    // =============================================
    // إضافة أعمدة جديدة لجدول companies
    // =============================================

    // إضافة عمود website
    try {
      await query(`
        ALTER TABLE companies
        ADD COLUMN website VARCHAR(255)
      `);
      console.log('✅ Column website added to companies (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column website already exists');
      } else {
        console.log('⚠️ Could not add website:', error.message);
      }
    }

    // إضافة عمود license_number (رقم الترخيص)
    try {
      await query(`
        ALTER TABLE companies
        ADD COLUMN license_number VARCHAR(100)
      `);
      console.log('✅ Column license_number added to companies (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column license_number already exists');
      } else {
        console.log('⚠️ Could not add license_number:', error.message);
      }
    }

    // =============================================
    // إضافة أعمدة جديدة لجدول users
    // =============================================

    // إضافة عمود last_login
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log('✅ Column last_login added to users (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column last_login already exists');
      } else {
        console.log('⚠️ Could not add last_login:', error.message);
      }
    }

    // إضافة عمود avatar (صورة المستخدم)
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN avatar TEXT
      `);
      console.log('✅ Column avatar added to users (if not exists)');
    } catch (error) {
      if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
        console.log('⏭️ Column avatar already exists');
      } else {
        console.log('⚠️ Could not add avatar:', error.message);
      }
    }

    // =============================================
    // إنشاء فهارس إضافية لتحسين الأداء
    // =============================================

    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
      console.log('✅ Index idx_leads_status created');
    } catch (error) {
      console.log('⚠️ Could not create idx_leads_status:', error.message);
    }

    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`);
      console.log('✅ Index idx_leads_created_at created');
    } catch (error) {
      console.log('⚠️ Could not create idx_leads_created_at:', error.message);
    }

    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      console.log('✅ Index idx_users_role created');
    } catch (error) {
      console.log('⚠️ Could not create idx_users_role:', error.message);
    }

    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_lead_companies_lead ON lead_companies(lead_id)`);
      console.log('✅ Index idx_lead_companies_lead created');
    } catch (error) {
      console.log('⚠️ Could not create idx_lead_companies_lead:', error.message);
    }

    console.log('\n✅ All columns and indexes checked/added successfully!');

  } catch (error) {
    console.error('❌ Error adding columns:', error);
  } finally {
    // Exit after migration
    process.exit(0);
  }
}

// Run migration
addColumns();