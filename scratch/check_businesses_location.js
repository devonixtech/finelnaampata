const { Client } = require('pg');
async function testIndex() {
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
        console.log('Creating earthdistance gist index...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_businesses_earthdistance 
            ON businesses USING gist (ll_to_earth(latitude, longitude));
        `);
        console.log('Index created successfully!');

        // verify index list
        const res = await client.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'businesses' AND indexname = 'idx_businesses_earthdistance';
        `);
        res.rows.forEach(row => {
            console.log(` - ${row.indexname}: ${row.indexdef}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
testIndex();
