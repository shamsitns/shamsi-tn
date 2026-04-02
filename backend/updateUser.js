const { initDatabase, query, getDbType } = require('./config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const validRoles = ['owner', 'general_manager', 'executive_manager', 'operations_manager', 'call_center'];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateUser() {
  console.log('\n════════════════════════════════════════════');
  console.log('✏️ Update User');
  console.log('════════════════════════════════════════════\n');
  
  try {
    await initDatabase();
    
    const email = await question('📧 Email of user to update: ');
    if (!email) {
      console.log('❌ Email is required');
      rl.close();
      return;
    }
    
    // Find user
    const userResult = await query('SELECT id, name, email, role, phone, is_active FROM users WHERE email = $1', [email]);
    const users = userResult.rows || userResult;
    
    if (!users || users.length === 0) {
      console.log(`❌ User not found: ${email}`);
      rl.close();
      return;
    }
    
    const user = users[0];
    console.log(`\n📋 Current user info:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Phone: ${user.phone || 'Not set'}`);
    console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
    
    const newName = await question(`\n📛 New name (${user.name}): `);
    const newRole = await question(`👔 New role (${user.role}): `);
    const newPhone = await question(`📞 New phone (${user.phone || 'not set'}): `);
    const newPassword = await question(`🔑 New password (leave empty to keep current): `);
    const isActiveInput = await question(`🟢 Active? (yes/no) (${user.is_active ? 'yes' : 'no'}): `);
    
    // Prepare update
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (newName && newName !== user.name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(newName);
    }
    
    if (newRole && validRoles.includes(newRole) && newRole !== user.role) {
      updates.push(`role = $${paramIndex++}`);
      params.push(newRole);
    }
    
    if (newPhone !== undefined && newPhone !== user.phone) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(newPhone || null);
    }
    
    if (newPassword && newPassword.length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(`password = $${paramIndex++}`);
      params.push(hashedPassword);
    }
    
    if (isActiveInput) {
      const isActive = isActiveInput.toLowerCase() === 'yes' || isActiveInput.toLowerCase() === 'y';
      if (isActive !== user.is_active) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
      }
    }
    
    if (updates.length === 0) {
      console.log('\n⚠️ No changes made');
      rl.close();
      return;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(user.id);
    
    const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await query(queryStr, params);
    
    console.log('\n✅ User updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    rl.close();
  }
}

updateUser();