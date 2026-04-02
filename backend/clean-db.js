const { initDatabase, query, getDbType } = require('./config/database');

async function cleanDatabase() {
  console.log('🧹 Cleaning test data...');
  console.log('📊 Database type:', getDbType());

  try {
    // Initialize database first
    await initDatabase();

    // =============================================
    // حذف جميع الطلبات (leads)
    // =============================================
    const leadsResult = await query(`SELECT COUNT(*) as count FROM leads`);
    const leadsCount = (leadsResult.rows || leadsResult)[0]?.count || 0;
    await query(`DELETE FROM leads`);
    console.log(`✅ ${leadsCount} leads deleted`);

    // =============================================
    // حذف جميع العلاقات بين الطلبات والشركات
    // =============================================
    const leadCompaniesResult = await query(`SELECT COUNT(*) as count FROM lead_companies`);
    const leadCompaniesCount = (leadCompaniesResult.rows || leadCompaniesResult)[0]?.count || 0;
    await query(`DELETE FROM lead_companies`);
    console.log(`✅ ${leadCompaniesCount} lead-company relations deleted`);

    // =============================================
    // حذف جميع تعيينات المديرين
    // =============================================
    const assignmentsResult = await query(`SELECT COUNT(*) as count FROM manager_assignments`);
    const assignmentsCount = (assignmentsResult.rows || assignmentsResult)[0]?.count || 0;
    await query(`DELETE FROM manager_assignments`);
    console.log(`✅ ${assignmentsCount} manager assignments deleted`);

    // =============================================
    // حذف سجل النشاطات
    // =============================================
    const logsResult = await query(`SELECT COUNT(*) as count FROM activity_logs`);
    const logsCount = (logsResult.rows || logsResult)[0]?.count || 0;
    await query(`DELETE FROM activity_logs`);
    console.log(`✅ ${logsCount} activity logs deleted`);

    // =============================================
    // حذف سجل العمولات
    // =============================================
    const commissionsResult = await query(`SELECT COUNT(*) as count FROM commissions`);
    const commissionsCount = (commissionsResult.rows || commissionsResult)[0]?.count || 0;
    await query(`DELETE FROM commissions`);
    console.log(`✅ ${commissionsCount} commission records deleted`);

    // =============================================
    // حذف جميع الشركات (مع التأكد من عدم وجود علاقات)
    // =============================================
    const companiesResult = await query(`SELECT COUNT(*) as count FROM companies`);
    const companiesCount = (companiesResult.rows || companiesResult)[0]?.count || 0;
    await query(`DELETE FROM companies`);
    console.log(`✅ ${companiesCount} companies deleted`);

    // =============================================
    // حذف جميع المستخدمين (مع الحفاظ على المستخدمين الأساسيين)
    // =============================================
    // ملاحظة: لا نحذف المستخدمين الأساسيين (owner, general_manager, etc.)
    // نتركهم لأنهم مهمون لتشغيل النظام
    
    // عرض المستخدمين المتبقين
    const usersResult = await query(`SELECT id, name, email, role FROM users`);
    const users = usersResult.rows || usersResult;
    console.log(`\n👥 Remaining users (${users.length}):`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    // =============================================
    // إعادة تعيين الـ sequences لـ PostgreSQL
    // =============================================
    if (getDbType() === 'postgres') {
      try {
        await query(`ALTER SEQUENCE leads_id_seq RESTART WITH 1`);
        await query(`ALTER SEQUENCE companies_id_seq RESTART WITH 1`);
        await query(`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
        await query(`ALTER SEQUENCE lead_companies_id_seq RESTART WITH 1`);
        await query(`ALTER SEQUENCE manager_assignments_id_seq RESTART WITH 1`);
        console.log(`✅ PostgreSQL sequences reset`);
      } catch (error) {
        console.log('⚠️ Could not reset sequences:', error.message);
      }
    }

    // =============================================
    // إحصائيات بعد التنظيف
    // =============================================
    console.log('\n📊 Database statistics after cleaning:');
    
    const finalLeads = await query(`SELECT COUNT(*) as count FROM leads`);
    const finalLeadsCount = (finalLeads.rows || finalLeads)[0]?.count || 0;
    console.log(`   📋 Leads: ${finalLeadsCount}`);
    
    const finalCompanies = await query(`SELECT COUNT(*) as count FROM companies`);
    const finalCompaniesCount = (finalCompanies.rows || finalCompanies)[0]?.count || 0;
    console.log(`   🏢 Companies: ${finalCompaniesCount}`);
    
    const finalUsers = await query(`SELECT COUNT(*) as count FROM users`);
    const finalUsersCount = (finalUsers.rows || finalUsers)[0]?.count || 0;
    console.log(`   👥 Users: ${finalUsersCount}`);
    
    const finalAssignments = await query(`SELECT COUNT(*) as count FROM manager_assignments`);
    const finalAssignmentsCount = (finalAssignments.rows || finalAssignments)[0]?.count || 0;
    console.log(`   📎 Manager assignments: ${finalAssignmentsCount}`);
    
    const finalLeadCompanies = await query(`SELECT COUNT(*) as count FROM lead_companies`);
    const finalLeadCompaniesCount = (finalLeadCompanies.rows || finalLeadCompanies)[0]?.count || 0;
    console.log(`   🔗 Lead-companies: ${finalLeadCompaniesCount}`);
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('   (User accounts preserved: owner, general_manager, executive_manager, operations_manager, call_center)');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run cleaner
cleanDatabase();