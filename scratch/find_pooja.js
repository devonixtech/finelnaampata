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
        
        // Find users matching 'pooja'
        console.log('--- Finding users ---');
        const userRes = await client.query("SELECT id, email, \"full_name\", role FROM users WHERE LOWER(\"full_name\") LIKE '%pooja%' OR LOWER(email) LIKE '%pooja%';");
        console.log(userRes.rows);

        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            
            // Find vendor profile
            console.log('\n--- Finding vendor profile ---');
            const vendorRes = await client.query("SELECT id, \"user_id\", \"business_name\" FROM vendors WHERE \"user_id\" = $1;", [user.id]);
            console.log(vendorRes.rows);

            if (vendorRes.rows.length > 0) {
                const vendor = vendorRes.rows[0];
                
                // Find businesses
                console.log('\n--- Finding businesses for vendor ---');
                const bizRes = await client.query("SELECT id, name, status, \"vendor_id\" FROM businesses WHERE \"vendor_id\" = $1;", [vendor.id]);
                console.log(bizRes.rows);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
