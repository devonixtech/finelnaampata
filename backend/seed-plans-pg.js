const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    INSERT INTO "pricing_plan" ("id", "name", "stripe_price_id", "price", "billing_cycle", "type", "description", "features", "is_active", "created_at", "updated_at")
    VALUES 
    (gen_random_uuid(), 'Premium Monthly', 'price_123', 5000, 'monthly', 'subscription', 'Premium plan', '[]', true, NOW(), NOW()),
    (gen_random_uuid(), 'Premium Yearly', 'price_456', 50000, 'yearly', 'subscription', 'Premium plan', '[]', true, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);
  console.log('Insert result:', res.rowCount);
  await client.end();
}

main().catch(console.error);
