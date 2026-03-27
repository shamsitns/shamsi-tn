const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'shamsi.db');
const db = new sqlite3.Database(dbPath);

const email = 'shamsi.tns@gmail.com';
const password = 'Levis1992*&';
const name = 'Admin Shamsi';

const hashedPassword = bcrypt.hashSync(password, 10);

db.get('SELECT * FROM admins WHERE email = ?', [email], (err, row) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }
    
    if (!row) {
        db.run('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function(err) {
                if (err) {
                    console.error('Error creating admin:', err.message);
                } else {
                    console.log('\n✅ Admin account created successfully!');
                    console.log('   📧 Email:', email);
                    console.log('   🔑 Password:', password);
                    console.log('   👤 Name:', name);
                }
                db.close();
            }
        );
    } else {
        console.log('ℹ️  Admin account already exists:', email);
        db.close();
    }
});