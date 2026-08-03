const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function run() {
  await client.connect();
  const vendorRes = await client.query('SELECT id, user_id FROM vendors WHERE id = \'e69bb0d5-31f4-41da-abfb-6db0b59b5894\'');
  if (vendorRes.rows.length > 0) {
    const userId = vendorRes.rows[0].user_id;
    const userRes = await client.query('SELECT id, notification_settings FROM users WHERE id = ', [userId]);
    console.log('User Settings:', userRes.rows[0]);
  }
  await client.end();
}
run().catch(console.error);
