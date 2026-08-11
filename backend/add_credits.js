const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@66.33.22.240:45505/railway',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const userRes = await client.query(`SELECT * FROM users WHERE email = 'yofosi5971@netiren.com'`);
  const userId = userRes.rows[0].id;
  
  const affRes = await client.query(`SELECT * FROM affiliates WHERE user_id = $1`, [userId]);
  console.log("Affiliate Before:", affRes.rows[0]);
  
  if (affRes.rows[0]) {
    await client.query(`UPDATE affiliates SET balance = balance + 2000, total_earnings = total_earnings + 2000 WHERE user_id = $1`, [userId]);
    const affResAfter = await client.query(`SELECT * FROM affiliates WHERE user_id = $1`, [userId]);
    console.log("Updated Affiliate:", affResAfter.rows[0]);
  } else {
    console.log("No affiliate profile found!");
  }

  await client.end();
}

run().catch(console.error);
