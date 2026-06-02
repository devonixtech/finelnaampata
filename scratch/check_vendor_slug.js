const { Client } = require('pg');
require('dotenv').config();

async function checkVendor() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@your-db-host:5432/local_business_listing'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const slug = 'aman-jeet-singh';
    const res = await client.query('SELECT * FROM vendors WHERE slug = $1', [slug]);

    if (res.rows.length > 0) {
      console.log('Vendor found:', res.rows[0].businessName, 'Slug:', res.rows[0].slug);
    } else {
      console.log('Vendor NOT found with slug:', slug);
      
      // List all slugs to help debug
      const allSlugs = await client.query('SELECT slug FROM vendors LIMIT 10');
      console.log('Existing slugs (first 10):', allSlugs.rows.map(r => r.slug));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkVendor();

