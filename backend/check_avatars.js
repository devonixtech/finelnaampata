const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway' });
client.connect().then(() => client.query('SELECT id, email, full_name, avatar_url FROM users WHERE avatar_url ILIKE \'%blob%\' LIMIT 5')).then(res => console.log(res.rows)).finally(() => client.end());
