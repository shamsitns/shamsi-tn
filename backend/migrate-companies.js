const { initDatabase, query } = require('./config/database');

const oldCompanies = [
  {
    id: 1,
    name: "شركة الطاقة الشمسية تونس",
    email: "contact@solar-tunisie.com",
    phone: "71234567",
    city: "تونس",
    address: null,
    description: "متخصصون في تركيب الأنظمة الشمسية للمنازل والشركات",
    is_active: 1,
    created_at: "2026-03-27 22:25:25"
  },
  {
    id: 2,
    name: "Solar Tunisie",
    email: "info@solartunisie.tn",
    phone: "74234567",
    city: "صفاقس",
    address: null,
    description: "خدمة ممتازة وأسعار منافسة في الجنوب التونسي",
    is_active: 1,
    created_at: "2026-03-27 22:25:25"
  },
  {
    id: 3,
    name: "Green Energy Tunisia",
    email: "contact@greenenergy.tn",
    phone: "73234567",
    city: "سوسة",
    address: null,
    description: "أفضل جودة وأطول ضمان في السوق التونسية",
    is_active: 1,
    created_at: "2026-03-27 22:25:25"
  }
];

async function migrateCompanies() {
  console.log('🔄 Migrating companies to new structure...');
  
  try {
    await initDatabase();
    
    for (const company of oldCompanies) {
      // Check if company already exists
      const existing = await query('SELECT id FROM companies WHERE email = $1', [company.email]);
      const existingRows = existing.rows || existing;
      
      if (existingRows.length === 0) {
        // Combine city and address
        const fullAddress = company.address 
          ? `${company.city}، ${company.address}` 
          : company.city;
        
        await query(
          `INSERT INTO companies (name, email, phone, address, contact_person, is_active, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            company.name,
            company.email,
            company.phone,
            fullAddress,
            null, // contact_person
            company.is_active === 1,
            company.created_at
          ]
        );
        console.log(`✅ Company migrated: ${company.name}`);
      } else {
        console.log(`⏭️ Company already exists: ${company.name}`);
      }
    }
    
    console.log('\n✅ Companies migration completed!');
    
    // Show migrated companies
    const result = await query('SELECT id, name, email, phone, address FROM companies');
    const companies = result.rows || result;
    console.log('\n📋 Companies in new database:');
    companies.forEach(c => {
      console.log(`   - ${c.name} (${c.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error migrating companies:', error);
  } finally {
    process.exit(0);
  }
}

migrateCompanies();