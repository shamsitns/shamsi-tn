const { initDatabase, query, getDbType } = require('./config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Valid roles
const validRoles = ['owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center'];

// Question helper
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('\n════════════════════════════════════════════');
  console.log('👤 Create New User');
  console.log('════════════════════════════════════════════\n');
  
  try {
    // Initialize database
    await initDatabase();
    console.log('📊 Database type:', getDbType());
    
    // Get user details
    const name = await question('📛 Full Name: ');
    if (!name) {
      console.log('❌ Name is required');
      rl.close();
      return;
    }
    
    const email = await question('📧 Email: ');
    if (!email) {
      console.log('❌ Email is required');
      rl.close();
      return;
    }
    
    const password = await question('🔑 Password: ');
    if (!password) {
      console.log('❌ Password is required');
      rl.close();
      return;
    }
    
    console.log('\n📋 Available roles:');
    validRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role}`);
    });
    
    const roleInput = await question(`👔 Role (1-${validRoles.length}): `);
    const roleIndex = parseInt(roleInput) - 1;
    const role = validRoles[roleIndex];
    
    if (!role) {
      console.log('❌ Invalid role selected');
      rl.close();
      return;
    }
    
    const phone = await question('📞 Phone (optional): ');
    
    console.log('\n🔍 Checking if user exists...');
    
    // Check if user already exists
    const existing = await query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    const existingRows = existing.rows || existing;
    
    if (existingRows && existingRows.length > 0) {
      console.log(`⚠️ User already exists with email: ${email}`);
      console.log(`   Role: ${existingRows[0].role}`);
      console.log('   Use update-user.js to modify existing user');
      rl.close();
      return;
    }
    
    // Create user
    console.log('\n📝 Creating user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await query(
      `INSERT INTO users (name, email, password, role, phone, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)`,
      [name, email, hashedPassword, role, phone || null]
    );
    
    console.log('\n✅ User created successfully!');
    console.log('════════════════════════════════════════════');
    console.log(`   👤 Name: ${name}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   👔 Role: ${role}`);
    if (phone) console.log(`   📞 Phone: ${phone}`);
    console.log('════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('Error details:', error.message);
  } finally {
    rl.close();
  }
}

// Function to create user non-interactively (for scripting)
async function createUserNonInteractive(name, email, password, role, phone = null) {
  try {
    await initDatabase();
    
    if (!validRoles.includes(role)) {
      console.log(`❌ Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
      return false;
    }
    
    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    const existingRows = existing.rows || existing;
    
    if (existingRows && existingRows.length > 0) {
      console.log(`⚠️ User already exists: ${email}`);
      return false;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await query(
      `INSERT INTO users (name, email, password, role, phone, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)`,
      [name, email, hashedPassword, role, phone || null]
    );
    
    console.log(`✅ User created: ${name} (${email}) - ${role}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return false;
  }
}

// Check command line arguments
if (process.argv.length > 2) {
  // Non-interactive mode
  const [,, name, email, password, role, phone] = process.argv;
  if (name && email && password && role) {
    createUserNonInteractive(name, email, password, role, phone).then(() => process.exit(0));
  } else {
    console.log('Usage: node createUser.js <name> <email> <password> <role> [phone]');
    console.log('Roles: owner, general_manager, executive_manager, operations_manager, call_center');
    process.exit(1);
  }
} else {
  // Interactive mode
  createUser();
}