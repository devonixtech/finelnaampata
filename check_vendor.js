const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, title, vendor_id FROM listings WHERE id = \'c972124f-95ed-4ab6-a480-08715e356b70\'');
  console.log(res.rows);
  if (res.rows.length > 0 && res.rows[0].vendor_id) {
    const vendorRes = await client.query('SELECT id, user_id FROM vendors WHERE id = ', [res.rows[0].vendor_id]);
    console.log('Vendor:', vendorRes.rows);
  }
  await client.end();
}
run().catch(console.error);
