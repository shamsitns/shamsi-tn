const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function createAdmin(name, email, password) {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const exists = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (exists.rows.length === 0) {
      await db.query(
        'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
        [name, email, hashedPassword]
      );
      console.log(`✅ Admin created: ${name}`);
    } else {
      console.log(`ℹ️ Admin already exists: ${email}`);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

// Example usage
createAdmin('New Admin', 'newadmin@shamsi.tn', 'admin123');