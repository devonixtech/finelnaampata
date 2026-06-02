const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
    const client = new Client({
        host: process.env.DB_HOST || 'your-db-host',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '5432',
        database: process.env.DB_DATABASE || 'business_saas_db',
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../../database/featured_businesses_seed.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing seeding script...');
        await client.query(sql);
        console.log('Seeding completed successfully!');
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await client.end();
    }
}

seed();

