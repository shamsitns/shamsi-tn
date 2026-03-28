const db = require('./config/database');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function importData() {
    console.log('📥 Importing data to PostgreSQL...');
    
    try {
        // استيراد المديرين
        const managers = JSON.parse(fs.readFileSync('data-managers.json', 'utf8'));
        for (const m of managers) {
            await db.query(
                'INSERT INTO managers (id, name, email, password, phone, company_name, city, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                [m.id, m.name, m.email, m.password, m.phone, m.company_name, m.city, m.created_at]
            );
            console.log(`✅ Manager: ${m.name}`);
        }
        
        // استيراد الشركات
        const companies = JSON.parse(fs.readFileSync('data-companies.json', 'utf8'));
        for (const c of companies) {
            await db.query(
                'INSERT INTO companies (id, name, email, password, phone, city, description, rating, projects_count, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING',
                [c.id, c.name, c.email, c.password, c.phone, c.city, c.description, c.rating, c.projects_count, c.created_at]
            );
            console.log(`✅ Company: ${c.name}`);
        }
        
        // استيراد العملاء
        const leads = JSON.parse(fs.readFileSync('data-leads.json', 'utf8'));
        for (const l of leads) {
            await db.query(
                `INSERT INTO leads (id, user_name, phone, city, property_type, payment_method, monthly_bill, 
                roof_area, roof_direction, shading, required_kw, estimated_price, panels, panel_power, 
                annual_production, annual_savings, payback_years, commission, status, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
                ON CONFLICT (id) DO NOTHING`,
                [l.id, l.user_name, l.phone, l.city, l.property_type, l.payment_method, l.monthly_bill,
                 l.roof_area, l.roof_direction, l.shading, l.required_kw, l.estimated_price, l.panels, l.panel_power,
                 l.annual_production, l.annual_savings, l.payback_years, l.commission, l.status, l.created_at]
            );
            console.log(`✅ Lead: ${l.user_name}`);
        }
        
        console.log('✅ Import completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

importData();