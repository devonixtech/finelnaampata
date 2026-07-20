const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => client.query('CREATE EXTENSION IF NOT EXISTS postgis;'))
  .then(() => { 
      console.log('PostGIS extension created successfully'); 
      process.exit(0); 
  })
  .catch(e => { 
      console.error('Failed to create PostGIS extension:', e); 
      process.exit(0); // Exit 0 to allow the app to start anyway
  });
