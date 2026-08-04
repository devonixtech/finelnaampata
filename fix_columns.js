const { Client } = require('pg');

const c = new Client({
  connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await c.connect();
  
  // Check existing columns
  const check = await c.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='businesses' 
    AND column_name IN (
      'search_impressions','click_to_call_count','converted_leads',
      'offer_views','offer_clicks','ad_impressions','ad_clicks',
      'avg_response_time_minutes','response_count','follower_history',
      'user_submitted_photos','contact_person_prefix'
    )
    ORDER BY column_name
  `);
  console.log('FOUND:', check.rows.map(x => x.column_name));
  console.log('TOTAL:', check.rows.length, '/ 12 expected');
  
  const missing = [
    { name: 'search_impressions', type: 'INTEGER DEFAULT 0' },
    { name: 'click_to_call_count', type: 'INTEGER DEFAULT 0' },
    { name: 'converted_leads', type: 'INTEGER DEFAULT 0' },
    { name: 'offer_views', type: 'INTEGER DEFAULT 0' },
    { name: 'offer_clicks', type: 'INTEGER DEFAULT 0' },
    { name: 'ad_impressions', type: 'INTEGER DEFAULT 0' },
    { name: 'ad_clicks', type: 'INTEGER DEFAULT 0' },
    { name: 'avg_response_time_minutes', type: 'REAL DEFAULT 0' },
    { name: 'response_count', type: 'INTEGER DEFAULT 0' },
    { name: 'follower_history', type: "JSONB DEFAULT '[]'" },
    { name: 'user_submitted_photos', type: "JSONB DEFAULT '[]'" },
    { name: 'contact_person_prefix', type: 'VARCHAR(10)' },
  ];
  
  const existing = new Set(check.rows.map(x => x.column_name));
  
  for (const col of missing) {
    if (!existing.has(col.name)) {
      try {
        await c.query(`ALTER TABLE businesses ADD COLUMN "${col.name}" ${col.type}`);
        console.log('CREATED:', col.name);
      } catch (e) {
        console.log('ERROR:', col.name, e.message);
      }
    } else {
      console.log('EXISTS:', col.name);
    }
  }
  
  // Verify after creation
  const after = await c.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='businesses' 
    AND column_name IN (
      'search_impressions','click_to_call_count','converted_leads',
      'offer_views','offer_clicks','ad_impressions','ad_clicks',
      'avg_response_time_minutes','response_count','follower_history',
      'user_submitted_photos','contact_person_prefix'
    )
  `);
  console.log('\nAFTER FIX:', after.rows.length, '/ 12 columns');
  
  // Test data on one business
  const test = await c.query(`
    SELECT id, title, search_impressions, click_to_call_count, converted_leads, 
           follower_history, user_submitted_photos, contact_person_prefix
    FROM businesses LIMIT 1
  `);
  console.log('\nTEST ROW:', JSON.stringify(test.rows[0], null, 2));
  
  await c.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
