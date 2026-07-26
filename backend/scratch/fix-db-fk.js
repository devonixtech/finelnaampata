const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');
        
        const res = await client.query(`
            DELETE FROM affiliate_referrals 
            WHERE affiliate_id IS NOT NULL 
            AND affiliate_id NOT IN (SELECT id FROM affiliates);
        `);
        console.log('Deleted orphaned affiliate_referrals:', res.rowCount);
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
