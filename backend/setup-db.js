const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(() => {
      console.log('Database connected successfully');
      return client.end();
  })
  .then(() => { 
      process.exit(0); 
  })
  .catch(e => { 
      console.error('Database connection failed:', e.message); 
      process.exit(0);
  });
