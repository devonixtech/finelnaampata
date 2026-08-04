const { Client } = require('pg');
const c = new Client('postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway');

async function main() {
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
  console.log('All user columns:', r.rows.map(x => x.column_name));
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
