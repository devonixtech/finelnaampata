const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, type, title, created_at, is_read FROM notifications ORDER BY created_at DESC LIMIT 5');
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
