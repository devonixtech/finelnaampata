const { Client } = require('pg');

async function createDatabase() {
    console.log('Connecting to PostgreSQL...');

    // Connect to default 'postgres' database
    const client = new Client({
        user: 'postgres',
        password: '5432',
        host: process.env.DB_HOST || 'your-db-host',
        port: 5432,
        database: 'business_saas_db'
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL!');

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'business_saas_db'");
        if (res.rowCount === 0) {
            console.log("Database 'business_saas_db' does not exist. Creating...");
            await client.query("CREATE DATABASE business_saas_db");
            console.log("Database 'business_saas_db' created successfully!");
        } else {
            console.log("Database 'business_saas_db' already exists.");
        }
    } catch (err) {
        console.error('Error connecting or creating database:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('Please check your PostgreSQL password in .env and update this script if necessary.');
        }
    } finally {
        await client.end();
    }
}

createDatabase();

