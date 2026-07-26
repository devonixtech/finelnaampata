const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');
        
        const res1 = await client.query(`
            DELETE FROM business_subcategories 
            WHERE business_id IS NOT NULL 
            AND business_id NOT IN (SELECT id FROM businesses);
        `);
        console.log('Deleted orphaned business_subcategories (business_id):', res1.rowCount);

        const res2 = await client.query(`
            DELETE FROM business_subcategories 
            WHERE subcategory_id IS NOT NULL 
            AND subcategory_id NOT IN (SELECT id FROM subcategories);
        `);
        console.log('Deleted orphaned business_subcategories (subcategory_id):', res2.rowCount);
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
