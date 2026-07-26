const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function cleanOrphans(table, fkColumn, refTable, refColumn) {
    try {
        const res = await client.query(`
            DELETE FROM ${table} 
            WHERE ${fkColumn} IS NOT NULL 
            AND ${fkColumn} NOT IN (SELECT ${refColumn} FROM ${refTable});
        `);
        console.log(`Cleaned ${res.rowCount} orphans from ${table}.${fkColumn}`);
    } catch(e) {
        // Table or column might not exist, skip
    }
}

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');
        
        await cleanOrphans('business_categories', 'business_id', 'businesses', 'id');
        await cleanOrphans('business_subcategories', 'business_id', 'businesses', 'id');
        await cleanOrphans('business_working_hours', 'business_id', 'businesses', 'id');
        await cleanOrphans('business_social_links', 'business_id', 'businesses', 'id');
        await cleanOrphans('business_faqs', 'business_id', 'businesses', 'id');
        await cleanOrphans('reviews', 'business_id', 'businesses', 'id');
        await cleanOrphans('reviews', 'user_id', 'users', 'id');
        await cleanOrphans('bookmarks', 'business_id', 'businesses', 'id');
        await cleanOrphans('bookmarks', 'user_id', 'users', 'id');
        await cleanOrphans('active_plans', 'business_id', 'businesses', 'id');
        await cleanOrphans('affiliates', 'user_id', 'users', 'id');
        await cleanOrphans('affiliate_referrals', 'affiliate_id', 'affiliates', 'id');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}
run();
