const { Client } = require('pg');
const c = new Client('postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway');

async function main() {
  await c.connect();
  
  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'review%'");
  console.log('Review tables:', tables.rows.map(r => r.table_name));
  
  const reviewCount = await c.query('SELECT COUNT(*) AS c FROM reviews');
  console.log('Reviews count:', reviewCount.rows[0].c);
  
  const replyCount = await c.query('SELECT COUNT(*) AS c FROM review_replies');
  console.log('Replies count:', replyCount.rows[0].c);
  
  const votesCount = await c.query('SELECT COUNT(*) AS c FROM review_helpful_votes');
  console.log('Helpful votes count:', votesCount.rows[0].c);
  
  const sampleReview = await c.query('SELECT id, business_id, rating, is_approved FROM reviews LIMIT 3');
  console.log('Sample reviews:', sampleReview.rows);
  
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
