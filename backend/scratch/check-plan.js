const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        const res1 = await client.query("SELECT name, price, type, features FROM pricing_plans WHERE name ILIKE '%free%' OR name ILIKE '%starter%'");
        console.log('pricing_plans:', JSON.stringify(res1.rows, null, 2));

        const res2 = await client.query("SELECT name, price, plan_type, dashboard_features FROM subscription_plans WHERE name ILIKE '%free%' OR name ILIKE '%starter%'");
        console.log('subscription_plans:', JSON.stringify(res2.rows, null, 2));
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
