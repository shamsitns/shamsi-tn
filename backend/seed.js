const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Seeding database...');
    
    try {
        // إنشاء حساب الأدمن
        const adminEmail = 'shamsi.tns@gmail.com';
        const adminPassword = 'Levis1992*&';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
        
        const adminExists = await db.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        if (adminExists.rows.length === 0) {
            await db.query(
                'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
                ['Shamsi TN', adminEmail, hashedAdminPassword]
            );
            console.log('✅ Admin account created');
        }
        
        // إنشاء مدير تجريبي
        const managerEmail = 'manager@shamsi.tn';
        const managerPassword = 'manager123';
        const hashedManagerPassword = bcrypt.hashSync(managerPassword, 10);
        
        const managerExists = await db.query('SELECT * FROM managers WHERE email = $1', [managerEmail]);
        if (managerExists.rows.length === 0) {
            await db.query(
                'INSERT INTO managers (name, email, password, phone, company_name, city) VALUES ($1, $2, $3, $4, $5, $6)',
                ['مدير تجريبي', managerEmail, hashedManagerPassword, '12345678', 'شركة الطاقة الشمسية', 'تونس']
            );
            console.log('✅ Manager account created');
        }
        
        // إنشاء شركات تجريبية
        const companies = [
            ['شركة الطاقة الشمسية تونس', 'contact@solar-tunisie.com', bcrypt.hashSync('solar123', 10), '71234567', 'تونس', 'متخصصون في تركيب الأنظمة الشمسية', 4.8, 120],
            ['Solar Tunisie', 'info@solartunisie.tn', bcrypt.hashSync('solar123', 10), '74234567', 'صفاقس', 'خدمة ممتازة وأسعار منافسة', 4.7, 95],
            ['Green Energy Tunisia', 'contact@greenenergy.tn', bcrypt.hashSync('solar123', 10), '73234567', 'سوسة', 'أفضل جودة وأطول ضمان', 4.9, 150]
        ];
        
        for (const company of companies) {
            const exists = await db.query('SELECT * FROM companies WHERE email = $1', [company[1]]);
            if (exists.rows.length === 0) {
                await db.query(
                    'INSERT INTO companies (name, email, password, phone, city, description, rating, projects_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    company
                );
                console.log(`✅ Company added: ${company[0]}`);
            }
        }
        
        // إنشاء طلب تجريبي (Lead)
        const leadExists = await db.query('SELECT * FROM leads LIMIT 1');
        if (leadExists.rows.length === 0) {
            await db.query(`
                INSERT INTO leads (
                    user_name, phone, city, property_type, payment_method,
                    monthly_bill, roof_area, roof_direction, shading,
                    required_kw, estimated_price, panels, panel_power,
                    annual_production, annual_savings, payback_years, commission, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            `, [
                'أحمد بن علي', '12345678', 'تونس', 'house', 'cash',
                250, 80, 'جنوب', 'لا يوجد',
                5, 16000, 10, 0.5,
                7500, 1650, 9.7, 500, 'new'
            ]);
            console.log('✅ Test lead created');
        }
        
        console.log('✅ Database seeding completed');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

seedDatabase();