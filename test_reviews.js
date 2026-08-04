const { Client } = require('pg');
const c = new Client('postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway');

async function main() {
  await c.connect();
  
  const bid = '661212dd-eac8-4e79-9d3f-c7e03d5465fd';
  
  // Test the exact raw SQL from reviews.service.ts
  const countSql = `SELECT COUNT(*) as cnt FROM reviews r LEFT JOIN businesses b ON b.id = r.business_id WHERE r.is_approved = $1 AND r.business_id = $2`;
  const countResult = await c.query(countSql, [true, bid]);
  console.log('Count:', countResult.rows[0].cnt);
  
  const dataSql = `
    SELECT r.*,
        json_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'avatar', u.avatar) as "user"
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id AND (u.delete_at IS NULL)
    LEFT JOIN businesses b ON b.id = r.business_id
    WHERE r.is_approved = $1 AND r.business_id = $2
    ORDER BY r.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  const dataResult = await c.query(dataSql, [true, bid, 10, 0]);
  console.log('Reviews:', dataResult.rows.length);
  if (dataResult.rows.length > 0) {
    console.log('First review:', JSON.stringify(dataResult.rows[0], null, 2));
  }
  
  await c.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
