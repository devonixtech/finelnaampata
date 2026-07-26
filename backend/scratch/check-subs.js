const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // Let's get the user ID for this vendor
        const res1 = await client.query("SELECT * FROM users LIMIT 5");
        const user = res1.rows.find(u => u.email.includes('ankit') || u.email.includes('ahmed') || u.email.includes('test'));
        if (!user) return console.log('No user', res1.rows.map(u => u.email));

        const res2 = await client.query("SELECT id FROM vendors WHERE user_id = $1", [user.id]);
        if (res2.rows.length === 0) return console.log('No vendor');
        const vendorId = res2.rows[0].id;

        // check active old subscriptions
        const res3 = await client.query("SELECT * FROM subscriptions WHERE vendor_id = $1", [vendorId]);
        console.log('subscriptions:', JSON.stringify(res3.rows, null, 2));

        // check active new plans
        const res4 = await client.query("SELECT * FROM active_plans WHERE vendor_id = $1", [vendorId]);
        console.log('active_plans:', JSON.stringify(res4.rows, null, 2));
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
