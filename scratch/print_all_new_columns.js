const { Client } = require('pg');
async function checkNew() {
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
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'businesses' 
              AND column_name IN ('location', 'legal_consent_accepted', 'legal_consent_ip', 'legal_consent_session_id', 'legal_consent_device_id');
        `);
        console.log('New columns verification:');
        res.rows.forEach(row => {
            console.log(` - ${row.column_name}: ${row.data_type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
checkNew();
