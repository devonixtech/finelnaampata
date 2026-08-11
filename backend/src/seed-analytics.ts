import { DataSource } from 'typeorm';

const dbUrl = 'postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway?sslmode=disable';

const dataSource = new DataSource({
    type: 'postgres',
    url: dbUrl,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    await dataSource.initialize();
    console.log('DB connected');

    // 1. Seed search_logs
    console.log('Seeding search_logs...');
    const searchTerms = ['plumber', 'electrician', 'salon', 'restaurant', 'cafe', 'dentist'];
    const cities = ['Karachi', 'Lahore', 'Islamabad'];
    
    for (let i = 0; i < 50; i++) {
        const keyword = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        await dataSource.query(`
            INSERT INTO search_logs (keyword, city, searched_at, ip_address) 
            VALUES ($1, $2, $3, $4)
        `, [keyword, city, date, `192.168.1.${Math.floor(Math.random() * 255)}`]);
    }

    // 2. Add views and leads to businesses
    console.log('Adding views and leads to businesses...');
    const businesses = await dataSource.query(`SELECT id FROM businesses LIMIT 10`);
    
    for (const b of businesses) {
        const views = Math.floor(Math.random() * 500) + 50;
        const leads = Math.floor(views * (Math.random() * 0.1)); // 0-10% conversion
        
        await dataSource.query(`
            UPDATE businesses 
            SET "totalViews" = $1, "totalLeads" = $2 
            WHERE id = $3
        `, [views, leads, b.id]);
    }

    // 3. Add some fake revenue (transactions)
    console.log('Adding revenue...');
    const users = await dataSource.query(`SELECT id FROM "users" LIMIT 5`);
    if (users.length > 0) {
        for (let i = 0; i < 10; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            const amount = [1000, 2500, 5000][Math.floor(Math.random() * 3)];
            
            await dataSource.query(`
                INSERT INTO transactions (user_id, amount, status, type, created_at, updated_at) 
                VALUES ($1, $2, 'completed', 'subscription', $3, $3)
            `, [user.id, amount, date]);
        }
    }

    console.log('Seed complete!');
    await dataSource.destroy();
}

run().catch(console.error);
