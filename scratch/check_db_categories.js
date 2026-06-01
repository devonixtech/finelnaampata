const { Client } = require('pg');

async function checkAdmins() {
    const client = new Client({
        connectionString: "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway",
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id, email, role, full_name FROM users WHERE role IN ('admin', 'superadmin')");
        console.log("Admin users in DB:", res.rows);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

checkAdmins();
