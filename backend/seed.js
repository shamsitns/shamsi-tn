const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Seeding database...');
    
    // إنشاء حساب الأدمن
    const adminPass = bcrypt.hashSync('Levis1992*&', 10);
    await db.execute(`INSERT OR IGNORE INTO admins (name, email, password) VALUES (?, ?, ?)`,
        ['Shamsi TN', 'shamsi.tns@gmail.com', adminPass]);
    
    // إنشاء مدير تجريبي
    const managerPass = bcrypt.hashSync('manager123', 10);
    await db.execute(`INSERT OR IGNORE INTO managers (name, email, password, phone, company_name, city) VALUES (?, ?, ?, ?, ?, ?)`,
        ['مدير تجريبي', 'manager@shamsi.tn', managerPass, '12345678', 'شركة الطاقة الشمسية', 'تونس']);
    
    // إنشاء شركات تجريبية
    const companies = [
        ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية', 4.8, 120],
        ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة', 4.7, 95],
        ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان', 4.9, 150]
    ];
    
    for (const company of companies) {
        await db.execute(`INSERT OR IGNORE INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, company);
    }
    
    console.log('✅ Database seeded successfully');
}

seedDatabase();