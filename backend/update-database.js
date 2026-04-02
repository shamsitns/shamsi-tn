const { initDatabase, query, getDbType } = require('./config/database');

async function updateDatabase() {
    console.log('🔄 Updating database with new tables and columns...');
    
    try {
        await initDatabase();
        console.log('📊 Database type:', getDbType());

        // ============================================
        // إضافة جدول البنوك
        // ============================================
        await query(`
            CREATE TABLE IF NOT EXISTS banks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact_person TEXT,
                email TEXT UNIQUE,
                phone TEXT,
                address TEXT,
                interest_rate REAL DEFAULT 5.0,
                max_financing_years INTEGER DEFAULT 7,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table banks created');

        // ============================================
        // إضافة جدول شركات التأجير التمويلي
        // ============================================
        await query(`
            CREATE TABLE IF NOT EXISTS leasing_companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact_person TEXT,
                email TEXT UNIQUE,
                phone TEXT,
                address TEXT,
                down_payment_percent REAL DEFAULT 10.0,
                max_contract_years INTEGER DEFAULT 7,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table leasing_companies created');

        // ============================================
        // إضافة جدول طلبات التمويل
        // ============================================
        await query(`
            CREATE TABLE IF NOT EXISTS financing_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
                financing_type TEXT NOT NULL CHECK (financing_type IN ('steg', 'prosol', 'bank', 'leasing')),
                bank_id INTEGER REFERENCES banks(id),
                leasing_id INTEGER REFERENCES leasing_companies(id),
                amount REAL,
                requested_amount REAL,
                approved_amount REAL,
                interest_rate REAL,
                duration_years INTEGER,
                monthly_installment REAL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
                assigned_to INTEGER REFERENCES users(id),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table financing_requests created');

        // ============================================
        // إضافة أعمدة جديدة إلى جدول leads
        // ============================================
        const newColumns = [
            'financing_type TEXT',
            'bank_id INTEGER REFERENCES banks(id)',
            'leasing_id INTEGER REFERENCES leasing_companies(id)',
            'financing_status TEXT DEFAULT \'pending\'',
            'preferred_bank_id INTEGER REFERENCES banks(id)',
            'monthly_income REAL',
            'has_guarantor INTEGER DEFAULT 0'
        ];

        for (const col of newColumns) {
            try {
                await query(`ALTER TABLE leads ADD COLUMN ${col}`);
                console.log(`✅ Added column: ${col.split(' ')[0]}`);
            } catch(e) {
                if (e.message.includes('duplicate') || e.message.includes('exists')) {
                    console.log(`⚠️ Column already exists: ${col.split(' ')[0]}`);
                } else {
                    console.log(`⚠️ Could not add ${col.split(' ')[0]}: ${e.message}`);
                }
            }
        }

        // ============================================
        // إضافة مستخدمين تجريبيين للأدوار الجديدة
        // ============================================
        const bcrypt = require('bcryptjs');
        
        // Bank Manager
        const bankManagerEmail = 'bank@shamsi.tn';
        const bankManagerPassword = 'bank123';
        const hashedBankPassword = bcrypt.hashSync(bankManagerPassword, 10);
        
        const existingBank = await query('SELECT id FROM users WHERE email = $1', [bankManagerEmail]);
        const bankRows = existingBank.rows || existingBank;
        
        if (!bankRows || bankRows.length === 0) {
            await query(
                `INSERT INTO users (name, email, password, role, phone, is_active, created_at) 
                 VALUES ($1, $2, $3, $4, $5, 1, CURRENT_TIMESTAMP)`,
                ['مدير بنك تجريبي', bankManagerEmail, hashedBankPassword, 'bank_manager', '24661499']
            );
            console.log('✅ Bank Manager account created');
        } else {
            console.log('⏭️ Bank Manager already exists');
        }
        
        // Leasing Manager
        const leasingManagerEmail = 'leasing@shamsi.tn';
        const leasingManagerPassword = 'leasing123';
        const hashedLeasingPassword = bcrypt.hashSync(leasingManagerPassword, 10);
        
        const existingLeasing = await query('SELECT id FROM users WHERE email = $1', [leasingManagerEmail]);
        const leasingRows = existingLeasing.rows || existingLeasing;
        
        if (!leasingRows || leasingRows.length === 0) {
            await query(
                `INSERT INTO users (name, email, password, role, phone, is_active, created_at) 
                 VALUES ($1, $2, $3, $4, $5, 1, CURRENT_TIMESTAMP)`,
                ['مدير تأجير تمويلي تجريبي', leasingManagerEmail, hashedLeasingPassword, 'leasing_manager', '24661499']
            );
            console.log('✅ Leasing Manager account created');
        } else {
            console.log('⏭️ Leasing Manager already exists');
        }

        // ============================================
        // إضافة بنوك تجريبية
        // ============================================
        const banks = [
            { name: 'بنك تونس العربي الدولي (ATB)', contact: 'محمد الفاهم', email: 'atb@shamsi.tn', phone: '71234567', rate: 5.0, years: 7 },
            { name: 'بنك الإسكان (BH)', contact: 'سامي بن أحمد', email: 'bh@shamsi.tn', phone: '71234568', rate: 4.8, years: 7 },
            { name: 'البنك التونسي (BT)', contact: 'نبيل بن سالم', email: 'bt@shamsi.tn', phone: '71234569', rate: 5.2, years: 7 },
            { name: 'بنك الأمان', contact: 'علي بن عمار', email: 'aman@shamsi.tn', phone: '71234570', rate: 4.5, years: 10 }
        ];

        for (const bank of banks) {
            const existing = await query('SELECT id FROM banks WHERE email = $1', [bank.email]);
            const existingRows = existing.rows || existing;
            
            if (!existingRows || existingRows.length === 0) {
                await query(
                    `INSERT INTO banks (name, contact_person, email, phone, interest_rate, max_financing_years, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6, 1)`,
                    [bank.name, bank.contact, bank.email, bank.phone, bank.rate, bank.years]
                );
                console.log(`✅ Bank added: ${bank.name}`);
            } else {
                console.log(`⏭️ Bank already exists: ${bank.name}`);
            }
        }

        // ============================================
        // إضافة شركات تأجير تمويلي تجريبية
        // ============================================
        const leasingCompanies = [
            { name: 'تونس للكراء المالي', contact: 'ليلى الحامدي', email: 'tunisie-lease@shamsi.tn', phone: '71234571', down: 10, years: 7 },
            { name: 'الشركة التونسية للتأجير', contact: 'محمد الصغير', email: 'tunisia-lease@shamsi.tn', phone: '71234572', down: 15, years: 5 },
            { name: 'أوريدو للتأجير', contact: 'سميرة بن عمار', email: 'oredoo-lease@shamsi.tn', phone: '71234573', down: 10, years: 7 }
        ];

        for (const leasing of leasingCompanies) {
            const existing = await query('SELECT id FROM leasing_companies WHERE email = $1', [leasing.email]);
            const existingRows = existing.rows || existing;
            
            if (!existingRows || existingRows.length === 0) {
                await query(
                    `INSERT INTO leasing_companies (name, contact_person, email, phone, down_payment_percent, max_contract_years, is_active) 
                     VALUES ($1, $2, $3, $4, $5, $6, 1)`,
                    [leasing.name, leasing.contact, leasing.email, leasing.phone, leasing.down, leasing.years]
                );
                console.log(`✅ Leasing company added: ${leasing.name}`);
            } else {
                console.log(`⏭️ Leasing company already exists: ${leasing.name}`);
            }
        }

        // ============================================
        // تحديث جدول users لدعم الأدوار الجديدة
        // ============================================
        // نلاحظ أن جدول users موجود بالفعل، نحتاج فقط للتأكد من أن الأدوار الجديدة مضمنة
        // الدور bank_manager و leasing_manager مضمنة في CHECK constraint
        
        console.log('\n════════════════════════════════════════════');
        console.log('✅ Database update completed successfully!');
        console.log('════════════════════════════════════════════');
        
        // عرض الإحصائيات
        const banksCount = await query('SELECT COUNT(*) as count FROM banks');
        const leasingCount = await query('SELECT COUNT(*) as count FROM leasing_companies');
        const usersCount = await query('SELECT COUNT(*) as count FROM users');
        const rolesResult = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        
        console.log('\n📊 Database Statistics:');
        console.log(`   🏦 Banks: ${(banksCount.rows || banksCount)[0]?.count || 0}`);
        console.log(`   🚗 Leasing Companies: ${(leasingCount.rows || leasingCount)[0]?.count || 0}`);
        console.log(`   👥 Total Users: ${(usersCount.rows || usersCount)[0]?.count || 0}`);
        console.log('\n   👤 Users by role:');
        const roles = rolesResult.rows || rolesResult;
        roles.forEach(r => {
            console.log(`      - ${r.role}: ${r.count}`);
        });
        console.log('\n🔑 New accounts:');
        console.log('   Bank Manager: bank@shamsi.tn / bank123');
        console.log('   Leasing Manager: leasing@shamsi.tn / leasing123');
        console.log('════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error updating database:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit(0);
    }
}

updateDatabase();