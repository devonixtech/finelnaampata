const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function main() {
  await client.connect();
  const res = await client.query(`UPDATE users SET role = 'vendor', is_email_verified = true WHERE email = 'testvendor@naampata.com'`);
  console.log('Update result:', res.rowCount);
  await client.end();
}

main().catch(console.error);
