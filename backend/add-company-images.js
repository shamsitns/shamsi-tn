const { initDatabase, query } = require('./config/database');

async function addCompanyColumns() {
    console.log('🔄 Adding image columns to companies table...');
    
    try {
        await initDatabase();
        console.log('✅ Database connected');

        // إضافة أعمدة الصور للشركات
        const columns = [
            'logo TEXT',
            'cover_image TEXT',
            'description TEXT',
            'rating REAL DEFAULT 0',
            'projects_count INTEGER DEFAULT 0',
            'established_year INTEGER',
            'license_number TEXT',
            'website TEXT'
        ];

        for (const col of columns) {
            try {
                await query(`ALTER TABLE companies ADD COLUMN ${col}`);
                console.log(`✅ Added column: ${col.split(' ')[0]}`);
            } catch(e) {
                if (e.message.includes('duplicate') || e.message.includes('exists')) {
                    console.log(`⚠️ Column already exists: ${col.split(' ')[0]}`);
                } else {
                    console.log(`⚠️ Could not add ${col.split(' ')[0]}`);
                }
            }
        }

        // إضافة شركات تجريبية مع صور
        const companies = [
            {
                name: 'شركة الطاقة الشمسية تونس',
                email: 'contact@solar-tunisie.com',
                phone: '71234567',
                address: 'تونس، تونس',
                contact_person: 'محمد الفاهم',
                description: 'متخصصون في تركيب الأنظمة الشمسية للمنازل والشركات منذ أكثر من 10 سنوات. نقدم خدماتنا في جميع ولايات تونس.',
                rating: 4.8,
                projects_count: 120,
                established_year: 2014,
                license_number: 'SOLAR-001',
                website: 'www.solar-tunisie.com',
                logo: '/images/companies/solar-tunisie-logo.png'
            },
            {
                name: 'Solar Tunisie',
                email: 'info@solartunisie.tn',
                phone: '74234567',
                address: 'صفاقس، تونس',
                contact_person: 'سامي بن أحمد',
                description: 'خدمة ممتازة وأسعار منافسة في الجنوب التونسي. نضمن لك أفضل جودة وأطول ضمان.',
                rating: 4.7,
                projects_count: 95,
                established_year: 2016,
                license_number: 'SOLAR-002',
                website: 'www.solartunisie.tn',
                logo: '/images/companies/solartunisie-logo.png'
            },
            {
                name: 'Green Energy Tunisia',
                email: 'contact@greenenergy.tn',
                phone: '73234567',
                address: 'سوسة، تونس',
                contact_person: 'نبيل بن سالم',
                description: 'أفضل جودة وأطول ضمان في السوق التونسية. نوفر حلول طاقة شمسية متكاملة.',
                rating: 4.9,
                projects_count: 150,
                established_year: 2012,
                license_number: 'SOLAR-003',
                website: 'www.greenenergy.tn',
                logo: '/images/companies/greenenergy-logo.png'
            },
            {
                name: 'Tunisia Solar Solutions',
                email: 'info@tunisiasolar.tn',
                phone: '70234567',
                address: 'بن عروس، تونس',
                contact_person: 'علي بن عمار',
                description: 'حلول طاقة شمسية مبتكرة للمنازل والشركات. فريق محترف وخبرة في المجال.',
                rating: 4.6,
                projects_count: 80,
                established_year: 2018,
                license_number: 'SOLAR-004',
                website: 'www.tunisiasolar.tn',
                logo: '/images/companies/tunisiasolar-logo.png'
            },
            {
                name: 'Eco Energie Tunisie',
                email: 'contact@ecoenergie.tn',
                phone: '71234568',
                address: 'نابل، تونس',
                contact_person: 'ليلى الحامدي',
                description: 'نعمل على توفير حلول طاقة نظيفة ومستدامة. شركة معتمدة من STEG.',
                rating: 4.8,
                projects_count: 110,
                established_year: 2015,
                license_number: 'SOLAR-005',
                website: 'www.ecoenergie.tn',
                logo: '/images/companies/ecoenergie-logo.png'
            }
        ];

        for (const company of companies) {
            const existing = await query('SELECT id FROM companies WHERE email = $1', [company.email]);
            const existingRows = existing.rows || existing;
            
            if (!existingRows || existingRows.length === 0) {
                await query(`
                    INSERT INTO companies (
                        name, email, phone, address, contact_person, 
                        description, rating, projects_count, established_year, 
                        license_number, website, logo, is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
                `, [
                    company.name, company.email, company.phone, company.address, company.contact_person,
                    company.description, company.rating, company.projects_count, company.established_year,
                    company.license_number, company.website, company.logo
                ]);
                console.log(`✅ Company added: ${company.name}`);
            } else {
                console.log(`⏭️ Company already exists: ${company.name}`);
            }
        }

        console.log('\n✅ Company columns added successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

addCompanyColumns();