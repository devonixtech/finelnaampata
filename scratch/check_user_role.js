const { Client } = require('pg');

async function getRole() {
    const client = new Client({
        connectionString: "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway",
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT email, role FROM users WHERE email = 'vendor_1780151722473@example.com'");
        console.log("Result:", res.rows);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

getRole();
