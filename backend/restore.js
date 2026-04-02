const { initDatabase, query, getDbType } = require('./config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function restoreDatabase() {
  console.log('\n════════════════════════════════════════════');
  console.log('🔄 Database Restore Tool');
  console.log('════════════════════════════════════════════\n');

  try {
    await initDatabase();
    console.log('📊 Database type:', getDbType());

    // List available backups
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      console.log('❌ No backups found. Run backup.js first.');
      rl.close();
      return;
    }

    const backups = fs.readdirSync(backupDir)
      .filter(f => fs.statSync(path.join(backupDir, f)).isDirectory())
      .sort()
      .reverse();

    if (backups.length === 0) {
      console.log('❌ No backups found.');
      rl.close();
      return;
    }

    console.log('📁 Available backups:\n');
    backups.forEach((backup, index) => {
      const metadataPath = path.join(backupDir, backup, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log(`   ${index + 1}. ${backup}`);
        console.log(`      📅 Date: ${new Date(metadata.backupDate).toLocaleString()}`);
        console.log(`      📋 Users: ${metadata.counts.users}, Leads: ${metadata.counts.leads}`);
      } else {
        console.log(`   ${index + 1}. ${backup}`);
      }
    });

    const choice = await question('\n🔢 Select backup number (1-' + backups.length + '): ');
    const selectedIndex = parseInt(choice) - 1;
    
    if (selectedIndex < 0 || selectedIndex >= backups.length) {
      console.log('❌ Invalid selection');
      rl.close();
      return;
    }

    const selectedBackup = backups[selectedIndex];
    const backupPath = path.join(backupDir, selectedBackup);
    
    console.log(`\n⚠️ WARNING: This will replace all existing data with backup from: ${selectedBackup}`);
    const confirm = await question('Type "CONFIRM" to continue: ');
    
    if (confirm !== 'CONFIRM') {
      console.log('❌ Restore cancelled');
      rl.close();
      return;
    }

    console.log('\n🔄 Restoring database...\n');

    // Clear existing data (preserve users? optional)
    const preserveUsers = await question('Keep existing users? (yes/no): ');
    const keepUsers = preserveUsers.toLowerCase() === 'yes';

    if (!keepUsers) {
      await query('DELETE FROM lead_companies');
      await query('DELETE FROM manager_assignments');
      await query('DELETE FROM activity_logs');
      await query('DELETE FROM commissions');
      await query('DELETE FROM leads');
      await query('DELETE FROM companies');
      await query('DELETE FROM users');
      console.log('   ✅ Existing data cleared');
    } else {
      await query('DELETE FROM lead_companies');
      await query('DELETE FROM manager_assignments');
      await query('DELETE FROM activity_logs');
      await query('DELETE FROM commissions');
      await query('DELETE FROM leads');
      await query('DELETE FROM companies');
      console.log('   ✅ Existing data cleared (users preserved)');
    }

    // Restore users
    const usersFile = path.join(backupPath, 'users.json');
    if (fs.existsSync(usersFile) && !keepUsers) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      for (const user of users) {
        await query(
          `INSERT INTO users (id, name, email, password, role, phone, is_active, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password,
           role = EXCLUDED.role, phone = EXCLUDED.phone, is_active = EXCLUDED.is_active`,
          [user.id, user.name, user.email, user.password, user.role, user.phone, user.is_active, user.created_at, user.updated_at]
        );
      }
      console.log(`   ✅ Users restored: ${users.length}`);
    }

    // Restore companies
    const companiesFile = path.join(backupPath, 'companies.json');
    if (fs.existsSync(companiesFile)) {
      const companies = JSON.parse(fs.readFileSync(companiesFile, 'utf8'));
      for (const company of companies) {
        await query(
          `INSERT INTO companies (id, name, email, phone, address, contact_person, is_active, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
           address = EXCLUDED.address, contact_person = EXCLUDED.contact_person, is_active = EXCLUDED.is_active`,
          [company.id, company.name, company.email, company.phone, company.address, company.contact_person, company.is_active, company.created_at]
        );
      }
      console.log(`   ✅ Companies restored: ${companies.length}`);
    }

    // Restore leads
    const leadsFile = path.join(backupPath, 'leads.json');
    if (fs.existsSync(leadsFile)) {
      const leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      for (const lead of leads) {
        await query(
          `INSERT INTO leads (
            id, name, phone, email, city, property_type, bill_amount, bill_period_months,
            bill_season, roof_availability, additional_info, required_kw, panels_count,
            commission_amount, status, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, phone = EXCLUDED.phone, status = EXCLUDED.status`,
          [
            lead.id, lead.name, lead.phone, lead.email, lead.city, lead.property_type,
            lead.bill_amount, lead.bill_period_months, lead.bill_season, lead.roof_availability,
            lead.additional_info, lead.required_kw, lead.panels_count, lead.commission_amount,
            lead.status, lead.notes, lead.created_at, lead.updated_at
          ]
        );
      }
      console.log(`   ✅ Leads restored: ${leads.length}`);
    }

    console.log('\n════════════════════════════════════════════');
    console.log('✅ Database restore completed successfully!');
    console.log(`📁 Restored from: ${selectedBackup}`);
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error restoring database:', error);
    console.error('Error details:', error.message);
  } finally {
    rl.close();
  }
}

// Run restore
restoreDatabase();