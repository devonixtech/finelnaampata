import { DataSource } from 'typeorm';

const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await ds.initialize();
    console.log("Connected");
    
    // Find User
    const res = await ds.query(`SELECT id FROM users WHERE email = 'huntergaming5555566@gmail.com'`);
    if(res.length === 0) {
        console.log("User not found");
        process.exit(1);
    }
    const userId = res[0].id;
    console.log("User ID:", userId);
    
    // Check if affiliate exists
    let affRes = await ds.query(`SELECT id, balance FROM affiliates WHERE user_id = $1`, [userId]);
    if(affRes.length === 0) {
        console.log("Creating affiliate profile...");
        await ds.query(`
            INSERT INTO affiliates (user_id, referral_code, total_earnings, balance, status, admin_approved)
            VALUES ($1, 'TESTCODE', 10000.00, 10000.00, 'active', true)
        `, [userId]);
    } else {
        console.log("Updating balance...");
        await ds.query(`
            UPDATE affiliates 
            SET balance = balance + 10000,
                total_earnings = total_earnings + 10000
            WHERE user_id = $1
        `, [userId]);
    }
    
    console.log("Done adding 10,000 RS");
    process.exit(0);
}
run();
