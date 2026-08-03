const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id FROM "users" WHERE email = \'superadmin@example.com\'');
  if (res.rows.length > 0) {
    const adminId = res.rows[0].id;
    await client.query(
      INSERT INTO "notifications" ("id", "user_id", "title", "message", "type", "is_read", "created_at")
      VALUES (gen_random_uuid(), , 'System Test', 'This is a test notification to verify the system works.', 'info', false, NOW())
    , [adminId]);
    console.log('Inserted test notification for', adminId);
  }
  await client.end();
}
run().catch(console.error);
