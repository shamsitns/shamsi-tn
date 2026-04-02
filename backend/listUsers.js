const { initDatabase, query, getDbType } = require('./config/database');

async function listUsers() {
  console.log('\n════════════════════════════════════════════');
  console.log('👥 Users List');
  console.log('════════════════════════════════════════════\n');
  
  try {
    await initDatabase();
    console.log('📊 Database type:', getDbType());
    
    const result = await query(`
      SELECT id, name, email, role, phone, is_active, created_at 
      FROM users 
      ORDER BY role, name
    `);
    
    const users = result.rows || result;
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    console.log(`📋 Total users: ${users.length}\n`);
    
    users.forEach(user => {
      const active = user.is_active ? '🟢' : '🔴';
      console.log(`${active} ${user.name}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   👔 ${user.role}`);
      if (user.phone) console.log(`   📞 ${user.phone}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();