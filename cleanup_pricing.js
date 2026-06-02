const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@your-db-host:5432/local_business_directory_db'
});

async function cleanup() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Truncate the offer_event_pricing table
    const res = await client.query('TRUNCATE TABLE offer_event_pricing CASCADE');
    console.log('Successfully truncated offer_event_pricing table.');
    
  } catch (err) {
    console.error('Error cleaning up data:', err);
  } finally {
    await client.end();
  }
}

cleanup();

