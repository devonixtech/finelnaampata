const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupCities() {
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

        // 1. Create Table
        console.log('Creating cities table...');
        const tableSqlPath = path.join(__dirname, '../../database/cities_table.sql');
        const tableSql = fs.readFileSync(tableSqlPath, 'utf8');
        await client.query(tableSql);
        console.log('Cities table created/verified.');

        // 2. Seed Data
        console.log('Seeding cities data...');
        const seedSqlPath = path.join(__dirname, '../../database/seed_cities.sql');
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        await client.query(seedSql);
        console.log('Cities seeding completed successfully!');

    } catch (err) {
        console.error('Error during setup:', err);
    } finally {
        await client.end();
    }
}

setupCities();

