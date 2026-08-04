const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
  ssl: { rejectUnauthorized: false }
});

const cols = [
  { name: 'search_impressions', type: 'INTEGER DEFAULT 0' },
  { name: 'click_to_call_count', type: 'INTEGER DEFAULT 0' },
  { name: 'converted_leads', type: 'INTEGER DEFAULT 0' },
  { name: 'offer_views', type: 'INTEGER DEFAULT 0' },
  { name: 'offer_clicks', type: 'INTEGER DEFAULT 0' },
  { name: 'ad_impressions', type: 'INTEGER DEFAULT 0' },
  { name: 'ad_clicks', type: 'INTEGER DEFAULT 0' },
  { name: 'avg_response_time_minutes', type: 'REAL DEFAULT 0' },
  { name: 'response_count', type: 'INTEGER DEFAULT 0' },
  { name: 'follower_history', type: "JSONB DEFAULT '[]'::jsonb" },
  { name: 'user_submitted_photos', type: "JSONB DEFAULT '[]'::jsonb" },
  { name: 'contact_person_prefix', type: 'VARCHAR(10)' },
  { name: 'saved_count', type: 'INTEGER DEFAULT 0' },
  { name: 'subscription_tier', type: 'INTEGER DEFAULT 0' },
  { name: 'manual_ranking_boost', type: 'INTEGER DEFAULT 0' },
  { name: 'click_count', type: 'INTEGER DEFAULT 0' },
];

(async () => {
  await c.connect();
  
  for (const col of cols) {
    try {
      const sql = `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
      await c.query(sql);
      console.log('OK:', col.name);
    } catch (e) {
      console.error('FAIL:', col.name, '-', e.message);
    }
  }

  // Verify
  const check = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='businesses'`);
  const allCols = check.rows.map(r => r.column_name);
  console.log('\nTotal columns:', allCols.length);
  
  // Check which of our columns exist now
  for (const col of cols) {
    const exists = allCols.includes(col.name);
    console.log(exists ? '  ✓' : '  ✗', col.name);
  }

  await c.end();
})();
