const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateCities() {
    const client = new Client({
        host: process.env.DB_HOST || 'your-db-host',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '5432',
        database: process.env.DB_DATABASE || 'business_saas_db',
    });

    try {
        await client.connect();

        const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Chandigarh', 'Gurgaon', 'Noida'];

        const { rows: businesses } = await client.query('SELECT id FROM businesses');

        console.log(`Found ${businesses.length} businesses. Spreading them across cities...`);

        for (let i = 0; i < businesses.length; i++) {
            const city = cities[i % cities.length];
            await client.query('UPDATE businesses SET city = $1 WHERE id = $2', [city, businesses[i].id]);
        }

        console.log('Update completed!');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

updateCities();

