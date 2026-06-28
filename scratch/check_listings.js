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
        const businessesRes = await client.query("SELECT COUNT(*) FROM businesses");
        console.log("Businesses count:", businessesRes.rows[0].count);
        
        const subRes = await client.query("SELECT COUNT(*) FROM business_subcategories");
        console.log("Business subcategories count:", subRes.rows[0].count);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

run();
