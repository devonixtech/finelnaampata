const jwt = require('jsonwebtoken');

async function testVendorStats() {
    // 1. Get a vendor user ID from the database
    const { Client } = require('pg');
    const dbClient = new Client({
        connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@66.33.22.240:45505/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await dbClient.connect();
        const res = await dbClient.query("SELECT id FROM users WHERE role = 'vendor' LIMIT 1");
        if (res.rows.length === 0) {
            console.log('No vendor found in DB');
            return;
        }
        const vendorId = res.rows[0].id;
        console.log('Found Vendor ID:', vendorId);

        // 2. Sign a fresh token
        const secret = 'super-secret-key-change-this-in-production';
        const token = jwt.sign({ sub: vendorId, role: 'vendor' }, secret, { expiresIn: '1h' });
        console.log('Generated fresh token');

        // 3. Call the endpoint
        const url = 'https://local-business-listing-directory-production.up.railway.app/api/v1/vendors/dashboard-stats';
        console.log('Fetching:', url);
        const r = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status:', r.status);
        const json = await r.json();
        console.log('Response:', JSON.stringify(json, null, 2));

    } catch (err) {
        console.error('Test Failed:', err.message);
    } finally {
        await dbClient.end();
    }
}

testVendorStats();

