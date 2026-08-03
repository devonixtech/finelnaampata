const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdmin() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const client = new Client({ connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway' });
  await client.connect();
  await client.query('UPDATE "users" SET password = $1 WHERE email = \'superadmin@example.com\'', [hash]);
  console.log('Password reset successfully to Admin@123');
  await client.end();
}
resetAdmin().catch(console.error);
