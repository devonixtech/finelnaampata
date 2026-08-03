const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      INSERT INTO notifications (user_id, title, message, type, priority, link, data, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `, [
      '24917349-cdce-4db0-b448-3f45aa58bdc0',
      'New Review Received! ⭐',
      'You received a 5-star review on "Test".',
      'review_received',
      'medium',
      '/reviews',
      '{}',
      false
    ]);
    console.log('Inserted:', res.rows[0]);
  } catch(e) {
    console.error('Insert error:', e);
  }
  await client.end();
}
run();
