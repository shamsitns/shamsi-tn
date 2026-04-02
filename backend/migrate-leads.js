const { initDatabase, query, getDbType } = require('./config/database');

// البيانات من الملف القديم
const oldLeads = [
  {
    id: 1, user_name: "mokhles ben amor", phone: "24661499", city: "صفاقس",
    property_type: "house", payment_method: "steg", monthly_bill: 147,
    roof_area: 147, roof_direction: "جنوب غرب", shading: "قليل",
    required_kw: 5.4, panels: 11, commission: 540, status: "rejected",
    manager_id: 1, created_at: "2026-03-27 21:18:20", updated_at: "2026-03-27 21:39:53"
  },
  {
    id: 2, user_name: "mokhles ben amor", phone: "24661499", city: "صفاقس",
    property_type: "house", payment_method: "steg", monthly_bill: 147,
    roof_area: 147, roof_direction: "جنوب غرب", shading: "قليل",
    required_kw: 5.4, panels: 11, commission: 540, status: "rejected",
    manager_id: 1, created_at: "2026-03-27 21:19:07", updated_at: "2026-03-27 21:39:56"
  },
  {
    id: 3, user_name: "mokhles ben amor", phone: "24661499", city: "المنستير",
    property_type: "commercial", payment_method: "cash", monthly_bill: 498,
    roof_area: 499, roof_direction: "شرق", shading: "لا يوجد",
    required_kw: -0.2, panels: 0, commission: -20, status: "rejected",
    manager_id: null, created_at: "2026-03-27 21:50:54", updated_at: "2026-03-27 22:05:54"
  },
  {
    id: 4, user_name: "mokhles ben amor", phone: "24661499", city: "المنستير",
    property_type: "commercial", payment_method: "cash", monthly_bill: 498,
    roof_area: 499, roof_direction: "شرق", shading: "لا يوجد",
    required_kw: 20.6, panels: 42, commission: 2060, status: "sent_to_manager",
    manager_id: 1, created_at: "2026-03-27 21:51:58", updated_at: "2026-03-27 22:05:56"
  },
  {
    id: 5, user_name: "mokhles ben amor", phone: "24661499", city: "أريانة",
    property_type: "house", payment_method: "cash", monthly_bill: 160,
    roof_area: 200, roof_direction: "شرق", shading: "لا يوجد",
    required_kw: 6.9, panels: 14, commission: 690, status: "new",
    manager_id: null, created_at: "2026-03-27 22:07:25", updated_at: "2026-03-27 22:07:25"
  },
  {
    id: 6, user_name: "mokhles ben amor", phone: "24661499", city: "بن عروس",
    property_type: "house", payment_method: "cash", monthly_bill: 220,
    roof_area: 150, roof_direction: "شرق", shading: "لا يوجد",
    required_kw: 9.5, panels: 19, commission: 1000, status: "new",
    manager_id: null, created_at: "2026-03-27 22:32:57", updated_at: "2026-03-27 22:32:57"
  },
  {
    id: 7, user_name: "mokhles ben amor", phone: "24661499", city: "جندوبة",
    property_type: "house", payment_method: "cash", monthly_bill: 120,
    roof_area: null, roof_direction: "جنوب", shading: "لا يوجد",
    required_kw: 4.7, panels: 10, commission: 500, status: "new",
    manager_id: null, created_at: "2026-03-27 22:36:40", updated_at: "2026-03-27 22:36:40"
  },
  {
    id: 8, user_name: "mokhles ben amor", phone: "24661499", city: "المهدية",
    property_type: "house", payment_method: "cash", monthly_bill: 120,
    roof_area: null, roof_direction: "جنوب", shading: "لا يوجد",
    required_kw: 4.1, panels: 9, commission: 500, status: "completed",
    manager_id: 1, created_at: "2026-03-27 22:38:43", updated_at: "2026-03-27 22:41:58"
  },
  {
    id: 9, user_name: "mokhles ben amor", phone: "24661499", city: "المنستير",
    property_type: "house", payment_method: "steg", monthly_bill: 50,
    roof_area: null, roof_direction: "جنوب", shading: "لا يوجد",
    required_kw: 1.8, panels: 4, commission: 300, status: "new",
    manager_id: null, created_at: "2026-03-27 22:45:56", updated_at: "2026-03-27 22:45:56"
  },
  {
    id: 10, user_name: "mokhles ben amor", phone: "24661499", city: "أريانة",
    property_type: "house", payment_method: "steg", monthly_bill: 160,
    roof_area: 147, roof_direction: "جنوب", shading: "لا يوجد",
    required_kw: 5.9, panels: 12, commission: 600, status: "sent_to_manager",
    manager_id: 1, created_at: "2026-03-27 23:00:07", updated_at: "2026-03-28 18:09:24"
  }
];

// Map old status to new status
const statusMap = {
  'new': 'pending',
  'sent_to_manager': 'approved',
  'rejected': 'cancelled',
  'completed': 'completed'
};

// Map old property_type to new (same)
// Map old payment_method to notes (since we don't have payment_method field)

async function migrateLeads() {
  console.log('🔄 Migrating leads to new structure...');
  console.log(`📋 Found ${oldLeads.length} leads to migrate\n`);

  try {
    await initDatabase();
    
    let migrated = 0;
    let skipped = 0;

    for (const lead of oldLeads) {
      // Skip leads with negative or zero required_kw
      if (lead.required_kw <= 0) {
        console.log(`⏭️ Skipping lead ${lead.id}: negative/zero required_kw (${lead.required_kw})`);
        skipped++;
        continue;
      }

      // Check if lead already exists
      const existing = await query('SELECT id FROM leads WHERE id = $1', [lead.id]);
      const existingRows = existing.rows || existing;
      
      if (existingRows.length > 0) {
        console.log(`⏭️ Lead ${lead.id} already exists, updating...`);
        
        // Update existing lead
        await query(`
          UPDATE leads SET
            name = $1, phone = $2, city = $3, property_type = $4,
            bill_amount = $5, bill_period_months = $6, bill_season = $7,
            roof_availability = $8, required_kw = $9, panels_count = $10,
            commission_amount = $11, status = $12, assigned_to = $13,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $14
        `, [
          lead.user_name,
          lead.phone,
          lead.city,
          lead.property_type,
          lead.monthly_bill,
          60, // bill_period_months (default 60 days for houses)
          'spring', // default season
          lead.roof_area ? true : false, // roof_availability
          lead.required_kw,
          lead.panels,
          lead.commission,
          statusMap[lead.status] || 'pending',
          lead.manager_id || null,
          lead.id
        ]);
        
        console.log(`✅ Updated lead ${lead.id}: ${lead.user_name}`);
      } else {
        // Insert new lead
        await query(`
          INSERT INTO leads (
            id, name, phone, city, property_type,
            bill_amount, bill_period_months, bill_season, roof_availability,
            required_kw, panels_count, commission_amount,
            status, assigned_to, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          lead.id,
          lead.user_name,
          lead.phone,
          lead.city,
          lead.property_type,
          lead.monthly_bill,
          60, // bill_period_months (default 60 days for houses)
          'spring', // default season
          lead.roof_area ? true : false,
          lead.required_kw,
          lead.panels,
          lead.commission,
          statusMap[lead.status] || 'pending',
          lead.manager_id || null,
          `Migrated from old system. Original data: roof_direction=${lead.roof_direction}, shading=${lead.shading}`,
          lead.created_at,
          lead.updated_at
        ]);
        
        console.log(`✅ Migrated lead ${lead.id}: ${lead.user_name}`);
        migrated++;
      }
    }

    console.log('\n════════════════════════════════════════════');
    console.log('✅ Leads migration completed!');
    console.log(`   📋 Migrated: ${migrated}`);
    console.log(`   ⏭️ Skipped: ${skipped}`);
    console.log(`   📊 Total processed: ${oldLeads.length}`);
    
    // Show statistics
    const result = await query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);
    const stats = result.rows || result;
    console.log('\n📊 Lead status in new database:');
    stats.forEach(s => {
      console.log(`   - ${s.status}: ${s.count}`);
    });
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error migrating leads:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateLeads();