const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // Fetch the free plan
        const res = await client.query(`SELECT id, dashboard_features FROM subscription_plans WHERE plan_type = 'free'`);
        if (res.rows.length > 0) {
            const plan = res.rows[0];
            const features = plan.dashboard_features;
            
            // Set showCustomerNotes to false
            features.showCustomerNotes = false;
            
            // Update the row
            await client.query(
                `UPDATE subscription_plans SET dashboard_features = $1 WHERE id = $2`,
                [JSON.stringify(features), plan.id]
            );
            
            console.log("Successfully updated free plan in DB to set showCustomerNotes = false");
        } else {
            console.log("Free plan not found in DB");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
