const { initDatabase, query, getDbType } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  console.log('💾 Creating database backup...');
  console.log('📊 Database type:', getDbType());

  try {
    await initDatabase();

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Create backup folder
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    console.log('\n📁 Backup location:', backupPath);
    
    // =============================================
    // Backup users
    // =============================================
    const usersResult = await query('SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users');
    const users = usersResult.rows || usersResult;
    fs.writeFileSync(
      path.join(backupPath, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`   ✅ Users: ${users.length}`);

    // =============================================
    // Backup companies
    // =============================================
    const companiesResult = await query('SELECT id, name, email, phone, address, contact_person, is_active, created_at FROM companies');
    const companies = companiesResult.rows || companiesResult;
    fs.writeFileSync(
      path.join(backupPath, 'companies.json'),
      JSON.stringify(companies, null, 2)
    );
    console.log(`   ✅ Companies: ${companies.length}`);

    // =============================================
    // Backup leads
    // =============================================
    const leadsResult = await query(`
      SELECT id, name, phone, email, city, property_type, bill_amount, bill_period_months,
             bill_season, roof_availability, additional_info, required_kw, panels_count, 
             commission_amount, status, notes, created_at, updated_at
      FROM leads
    `);
    const leads = leadsResult.rows || leadsResult;
    fs.writeFileSync(
      path.join(backupPath, 'leads.json'),
      JSON.stringify(leads, null, 2)
    );
    console.log(`   ✅ Leads: ${leads.length}`);

    // =============================================
    // Backup lead_companies
    // =============================================
    const leadCompaniesResult = await query(`
      SELECT id, lead_id, company_id, assigned_by, notes, status, assigned_at
      FROM lead_companies
    `);
    const leadCompanies = leadCompaniesResult.rows || leadCompaniesResult;
    fs.writeFileSync(
      path.join(backupPath, 'lead_companies.json'),
      JSON.stringify(leadCompanies, null, 2)
    );
    console.log(`   ✅ Lead-Companies: ${leadCompanies.length}`);

    // =============================================
    // Backup manager_assignments
    // =============================================
    const assignmentsResult = await query(`
      SELECT id, lead_id, manager_id, assigned_by, notes, status, assigned_at
      FROM manager_assignments
    `);
    const assignments = assignmentsResult.rows || assignmentsResult;
    fs.writeFileSync(
      path.join(backupPath, 'manager_assignments.json'),
      JSON.stringify(assignments, null, 2)
    );
    console.log(`   ✅ Manager assignments: ${assignments.length}`);

    // =============================================
    // Backup activity_logs (last 1000 only)
    // =============================================
    const logsResult = await query(`
      SELECT id, user_id, action, details, ip_address, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 1000
    `);
    const logs = logsResult.rows || logsResult;
    fs.writeFileSync(
      path.join(backupPath, 'activity_logs.json'),
      JSON.stringify(logs, null, 2)
    );
    console.log(`   ✅ Activity logs: ${logs.length}`);

    // =============================================
    // Backup commissions
    // =============================================
    const commissionsResult = await query(`
      SELECT id, lead_id, amount, status, paid_at, created_at
      FROM commissions
    `);
    const commissions = commissionsResult.rows || commissionsResult;
    fs.writeFileSync(
      path.join(backupPath, 'commissions.json'),
      JSON.stringify(commissions, null, 2)
    );
    console.log(`   ✅ Commissions: ${commissions.length}`);

    // Create metadata file
    const metadata = {
      backupDate: new Date().toISOString(),
      databaseType: getDbType(),
      counts: {
        users: users.length,
        companies: companies.length,
        leads: leads.length,
        leadCompanies: leadCompanies.length,
        managerAssignments: assignments.length,
        activityLogs: logs.length,
        commissions: commissions.length
      }
    };
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n════════════════════════════════════════════');
    console.log('✅ Backup completed successfully!');
    console.log(`📁 Location: ${backupPath}`);
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run backup
backupDatabase();