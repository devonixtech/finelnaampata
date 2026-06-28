const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function run() {
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
        
        const userId = 'daafcd7a-0232-42b5-8c74-c75517093204';
        
        // Find vendor
        const vendorRes = await client.query("SELECT id FROM vendors WHERE \"user_id\" = $1;", [userId]);
        const vendor = vendorRes.rows[0];
        console.log('Vendor:', vendor);

        if (vendor) {
            // Count businesses
            const businessCountRes = await client.query(
                "SELECT COUNT(*) FROM businesses WHERE \"vendor_id\" = $1 AND status = 'approved';",
                [vendor.id]
            );
            console.log('Approved business count in SQL:', businessCountRes.rows[0]);

            const allBusinessCountRes = await client.query(
                "SELECT COUNT(*) FROM businesses WHERE \"vendor_id\" = $1;",
                [vendor.id]
            );
            console.log('All business count in SQL:', allBusinessCountRes.rows[0]);

            // Query builder equivalent
            const totalLeadsRes = await client.query(
                "SELECT SUM(total_leads) AS total FROM businesses WHERE \"vendor_id\" = $1 AND status = 'approved';",
                [vendor.id]
            );
            console.log('Total Leads:', totalLeadsRes.rows[0]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
