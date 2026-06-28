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
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'categories'
        `);
        console.log("Categories columns:", res.rows);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

run();
