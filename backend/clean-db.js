const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'shamsi.db');
const db = new sqlite3.Database(dbPath);

console.log('\n╔════════════════════════════════════════════╗');
console.log('║     🧹 Nettoyage de la base de données    ║');
console.log('╚════════════════════════════════════════════╝\n');

// Afficher les comptes avant suppression
console.log('📋 Comptes avant nettoyage:\n');

db.all("SELECT id, name, email FROM admins", [], (err, rows) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
    } else {
        console.log('👑 Comptes Admin:');
        if (rows.length === 0) {
            console.log('   Aucun compte admin');
        } else {
            rows.forEach(row => {
                console.log(`   - ${row.name} (${row.email})`);
            });
        }
    }
    
    db.all("SELECT id, name, email FROM managers", [], (err, rows) => {
        if (err) {
            console.error('❌ Erreur:', err.message);
        } else {
            console.log('\n👥 Comptes Manager:');
            if (rows.length === 0) {
                console.log('   Aucun compte manager');
            } else {
                rows.forEach(row => {
                    console.log(`   - ${row.name} (${row.email})`);
                });
            }
        }
        
        console.log('\n⏳ Suppression des comptes fictifs...\n');
        
        // Supprimer les comptes admin fictifs
        db.run("DELETE FROM admins WHERE email IN ('admin@shamsi.tn', 'manager@shamsi.tn')", function(err) {
            if (err) {
                console.error('❌ Erreur suppression admins:', err.message);
            } else {
                console.log(`✅ ${this.changes} compte(s) admin supprimé(s)`);
            }
        });
        
        // Supprimer les comptes manager fictifs
        db.run("DELETE FROM managers WHERE email = 'manager@shamsi.tn'", function(err) {
            if (err) {
                console.error('❌ Erreur suppression managers:', err.message);
            } else {
                console.log(`✅ ${this.changes} compte(s) manager supprimé(s)\n`);
            }
        });
        
        // Afficher les comptes restants après 1 seconde
        setTimeout(() => {
            console.log('📋 Comptes après nettoyage:\n');
            
            db.all("SELECT id, name, email FROM admins", [], (err, rows) => {
                if (err) {
                    console.error('❌ Erreur:', err.message);
                } else {
                    console.log('👑 Comptes Admin:');
                    if (rows.length === 0) {
                        console.log('   ⚠️  Aucun compte admin!');
                        console.log('   💡 Veuillez créer un compte avec: node create-admin.js\n');
                    } else {
                        rows.forEach(row => {
                            console.log(`   ✅ ${row.name} (${row.email})`);
                        });
                    }
                }
                
                db.all("SELECT id, name, email FROM managers", [], (err, rows) => {
                    if (err) {
                        console.error('❌ Erreur:', err.message);
                    } else {
                        console.log('\n👥 Comptes Manager:');
                        if (rows.length === 0) {
                            console.log('   Aucun compte manager');
                        } else {
                            rows.forEach(row => {
                                console.log(`   - ${row.name} (${row.email})`);
                            });
                        }
                    }
                    
                    console.log('\n╔════════════════════════════════════════════╗');
                    console.log('║     ✅ Nettoyage terminé avec succès!      ║');
                    console.log('╚════════════════════════════════════════════╝\n');
                    db.close();
                });
            });
        }, 500);
    });
});