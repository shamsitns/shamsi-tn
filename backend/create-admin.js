const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const dbPath = path.join(__dirname, 'data', 'shamsi.db');
const db = new sqlite3.Database(dbPath);

console.log('\n╔════════════════════════════════════════════╗');
console.log('║     🔐 إنشاء حساب الأدمن الرئيسي         ║');
console.log('╚════════════════════════════════════════════╝\n');

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function createAdmin() {
    try {
        const email = await askQuestion('📧 البريد الإلكتروني: ');
        if (!email) {
            console.log('\n❌ البريد الإلكتروني مطلوب!');
            rl.close();
            db.close();
            return;
        }
        
        const name = await askQuestion('👤 الاسم: ');
        if (!name) {
            console.log('\n❌ الاسم مطلوب!');
            rl.close();
            db.close();
            return;
        }
        
        const password = await askQuestion('🔑 كلمة المرور: ');
        if (!password) {
            console.log('\n❌ كلمة المرور مطلوبة!');
            rl.close();
            db.close();
            return;
        }
        
        const confirmPassword = await askQuestion('✅ تأكيد كلمة المرور: ');
        
        if (password !== confirmPassword) {
            console.log('\n❌ خطأ: كلمة المرور غير متطابقة!');
            rl.close();
            db.close();
            return;
        }
        
        if (password.length < 6) {
            console.log('\n❌ خطأ: كلمة المرور يجب أن تكون 6 أحرف على الأقل!');
            rl.close();
            db.close();
            return;
        }
        
        console.log('\n⏳ جاري إنشاء الحساب...\n');
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.get('SELECT * FROM admins WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error('❌ خطأ في قاعدة البيانات:', err.message);
                rl.close();
                db.close();
                return;
            }
            
            if (row) {
                console.log('⚠️  هذا البريد الإلكتروني مسجل مسبقاً!');
                console.log(`   📧 ${email}\n`);
                rl.close();
                db.close();
                return;
            }
            
            db.run('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        console.error('❌ خطأ في إنشاء الحساب:', err.message);
                    } else {
                        console.log('╔════════════════════════════════════════════╗');
                        console.log('║     ✅ تم إنشاء حساب الأدمن بنجاح!        ║');
                        console.log('╚════════════════════════════════════════════╝');
                        console.log('\n📋 بيانات الحساب:');
                        console.log(`   📧 البريد الإلكتروني: ${email}`);
                        console.log(`   👤 الاسم: ${name}`);
                        console.log(`   🔑 كلمة المرور: ${'*'.repeat(password.length)}`);
                        console.log('\n🔐 يمكنك الآن تسجيل الدخول باستخدام هذه البيانات');
                        console.log(`   رابط تسجيل الدخول: http://localhost:3000/admin\n`);
                    }
                    rl.close();
                    db.close();
                }
            );
        });
        
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        rl.close();
        db.close();
    }
}

createAdmin();