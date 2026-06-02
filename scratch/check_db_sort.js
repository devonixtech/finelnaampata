const { Client } = require('pg');

async function checkBusinesses() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@your-db-host:5432/local_business_listing'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT title, is_featured, is_sponsored, created_at FROM businesses ORDER BY created_at DESC LIMIT 20');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkBusinesses();

