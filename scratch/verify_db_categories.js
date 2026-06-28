const { Client } = require('pg');

const connStr = "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway";

async function run() {
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // 1. Total categories count
        const totalRes = await client.query("SELECT COUNT(*) FROM categories");
        console.log("Total Categories in Database:", totalRes.rows[0].count);
        
        // 2. Count by level
        const level1Res = await client.query("SELECT COUNT(*) FROM categories WHERE parent_id IS NULL");
        console.log("Main Categories (Level 1):", level1Res.rows[0].count);
        
        const level2Res = await client.query(`
            SELECT COUNT(*) FROM categories c
            WHERE parent_id IS NOT NULL AND parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL)
        `);
        console.log("Subcategories (Level 2):", level2Res.rows[0].count);
        
        const level3Res = await client.query(`
            SELECT COUNT(*) FROM categories c
            WHERE parent_id IS NOT NULL AND parent_id NOT IN (SELECT id FROM categories WHERE parent_id IS NULL)
        `);
        console.log("Business Types (Level 3):", level3Res.rows[0].count);
        
        // 3. List the Main Categories
        const mains = await client.query("SELECT id, name, slug FROM categories WHERE parent_id IS NULL ORDER BY name");
        console.log("\nMain Categories list:");
        mains.rows.forEach(m => {
            console.log(`- ${m.name} (${m.slug})`);
        });
        
    } catch (e) {
        console.error("Verification error:", e);
    } finally {
        await client.end();
    }
}

run();
