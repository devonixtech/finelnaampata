const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway",
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT COUNT(*) FROM categories");
        console.log("Categories count in DB:", res.rows[0].count);
        
        const sample = await client.query("SELECT * FROM categories LIMIT 5");
        console.log("Sample categories:", sample.rows);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

run();
