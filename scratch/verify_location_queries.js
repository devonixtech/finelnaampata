const { Client } = require('pg');
async function verifyQueries() {
    const client = new Client({
        host: '66.33.22.240',
        port: 45505,
        user: 'postgres',
        password: 'RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI',
        database: 'railway',
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log('1. Testing search fallback query...');
        const searchRes = await client.query(`
            SELECT id, name, latitude, longitude,
                   earth_distance(ll_to_earth(latitude, longitude), ll_to_earth(31.5204, 74.3587)) as distance_meters
            FROM businesses
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
              AND earth_distance(ll_to_earth(latitude, longitude), ll_to_earth(31.5204, 74.3587)) <= 250000
            ORDER BY distance_meters ASC
            LIMIT 5;
        `);
        console.log(` ✅ Search query successful! Found ${searchRes.rows.length} rows.`);
        searchRes.rows.forEach(row => {
            console.log(`    - ${row.name}: ${(row.distance_meters / 1000).toFixed(2)} km`);
        });

        console.log('\n2. Testing duplicate detection fallback query...');
        const dupRes = await client.query(`
            SELECT id, name
            FROM businesses
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
              AND earth_distance(ll_to_earth(latitude, longitude), ll_to_earth(31.4992, 74.2998)) <= 10
            LIMIT 5;
        `);
        console.log(` ✅ Duplicate check query successful! Found ${dupRes.rows.length} matches.`);
        dupRes.rows.forEach(row => {
            console.log(`    - ${row.name}`);
        });

    } catch (err) {
        console.error('❌ Query failed:', err);
    } finally {
        await client.end();
    }
}
verifyQueries();
