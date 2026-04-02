const { initDatabase, query, getDbType } = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Initialize database first
    await initDatabase();
    
    console.log('📊 Database type:', getDbType());

    // =============================================
    // المستخدمون (Users) - جميع الأدوار
    // =============================================
    
    const users = [
      {
        name: 'مالك المنصة',
        email: 'shamsi.tns@gmail.com',
        password: 'Levis1992*&',
        role: 'owner',
        phone: '24661499',
        is_active: true
      },
      {
        name: 'مدير عام',
        email: 'gm@shamsi.tn',
        password: 'gm123',
        role: 'general_manager',
        phone: '24661499',
        is_active: true
      },
      {
        name: 'محمد إبراهيم الحصايري',
        email: 'manager@shamsi.tn',
        password: 'manager123',
        role: 'executive_manager',
        phone: '29593641',
        is_active: true
      },
      {
        name: 'أحمد شبوح',
        email: 'operations@shamsi.tn',
        password: 'operations123',
        role: 'operations_manager',
        phone: '50575558',
        is_active: true
      },
      {
        name: 'مركز الاتصال',
        email: 'callcenter@shamsi.tn',
        password: 'call123',
        role: 'call_center',
        phone: '24661499',
        is_active: true
      }
    ];

    for (const user of users) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [user.email]);
      const rows = existing.rows || existing;
      
      if (!rows || rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await query(
          `INSERT INTO users (name, email, password, role, phone, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.name, user.email, hashedPassword, user.role, user.phone, user.is_active]
        );
        console.log(`✅ User created: ${user.name} (${user.role})`);
      } else {
        console.log(`⏭️ User already exists: ${user.email}`);
      }
    }

    // =============================================
    // الشركات (Companies)
    // =============================================
    
    const companies = [
      {
        name: 'شركة الطاقة الشمسية تونس',
        email: 'contact@solar-tunisie.com',
        phone: '71234567',
        address: 'تونس، تونس',
        contact_person: 'محمد الفاهم',
        is_active: true
      },
      {
        name: 'Solar Tunisie',
        email: 'info@solartunisie.tn',
        phone: '74234567',
        address: 'صفاقس، تونس',
        contact_person: 'سامي بن أحمد',
        is_active: true
      },
      {
        name: 'Green Energy Tunisia',
        email: 'contact@greenenergy.tn',
        phone: '73234567',
        address: 'سوسة، تونس',
        contact_person: 'نبيل بن سالم',
        is_active: true
      },
      {
        name: 'Tunisia Solar Solutions',
        email: 'info@tunisiasolar.tn',
        phone: '70234567',
        address: 'بن عروس، تونس',
        contact_person: 'علي بن عمار',
        is_active: true
      },
      {
        name: 'Eco Energie Tunisie',
        email: 'contact@ecoenergie.tn',
        phone: '71234568',
        address: 'نابل، تونس',
        contact_person: 'ليلى الحامدي',
        is_active: true
      }
    ];

    for (const company of companies) {
      const existing = await query('SELECT id FROM companies WHERE email = $1', [company.email]);
      const rows = existing.rows || existing;
      
      if (!rows || rows.length === 0) {
        await query(
          `INSERT INTO companies (name, email, phone, address, contact_person, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [company.name, company.email, company.phone, company.address, company.contact_person, company.is_active]
        );
        console.log(`✅ Company added: ${company.name}`);
      } else {
        console.log(`⏭️ Company already exists: ${company.name}`);
      }
    }

    // =============================================
    // طلب تجريبي (Lead) - للاختبار
    // =============================================
    
    const leadExists = await query('SELECT id FROM leads LIMIT 1');
    const leadRows = leadExists.rows || leadExists;
    
    if (!leadRows || leadRows.length === 0) {
      await query(`
        INSERT INTO leads (
          name, phone, email, city, property_type,
          bill_amount, bill_period_months, bill_season, roof_availability,
          required_kw, panels_count, commission_amount,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      `, [
        'أحمد بن علي',
        '12345678',
        'ahmed.benali@example.com',
        'تونس',
        'house',
        250,      // bill_amount
        60,       // bill_period_months (شهرين للمنازل)
        'summer', // bill_season
        true,     // roof_availability
        5.0,      // required_kw
        10,       // panels_count
        750,      // commission_amount (5 kW × 150)
        'pending'
      ]);
      console.log('✅ Test lead created');
    } else {
      console.log('⏭️ Test lead already exists');
    }

    // =============================================
    // إحصائيات بعد الإضافة
    // =============================================
    
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    const companiesCount = await query('SELECT COUNT(*) as count FROM companies');
    const leadsCount = await query('SELECT COUNT(*) as count FROM leads');
    
    const usersCountVal = (usersCount.rows || usersCount)[0]?.count || 0;
    const companiesCountVal = (companiesCount.rows || companiesCount)[0]?.count || 0;
    const leadsCountVal = (leadsCount.rows || leadsCount)[0]?.count || 0;
    
    console.log('\n════════════════════════════════════════════');
    console.log('✅ Database seeding completed!');
    console.log('════════════════════════════════════════════');
    console.log(`📊 Statistics:`);
    console.log(`   👥 Users: ${usersCountVal}`);
    console.log(`   🏢 Companies: ${companiesCountVal}`);
    console.log(`   📋 Leads: ${leadsCountVal}`);
    console.log('\n📋 Accounts:');
    console.log('   👑 Owner: shamsi.tns@gmail.com / Levis1992*&');
    console.log('   🏢 General Manager: gm@shamsi.tn / gm123');
    console.log('   👔 Executive Manager: manager@shamsi.tn / manager123');
    console.log('   🔧 Operations Manager: operations@shamsi.tn / operations123');
    console.log('   📞 Call Center: callcenter@shamsi.tn / call123');
    console.log('\n🏢 Companies:');
    for (const company of companies) {
      console.log(`   - ${company.name} (${company.email})`);
    }
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close database connection if needed
    process.exit(0);
  }
}

// Run seeder
seedDatabase();