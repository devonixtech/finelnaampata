const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@66.33.22.240:45505/railway',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to DB!");

  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log("Tables:", res.rows.map(r => r.table_name));

  await client.end();
}

run().catch(console.error);
