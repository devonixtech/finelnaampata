const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    password: '5432',
    host: process.env.DB_HOST || 'your-db-host',
    port: 5432,
    database: 'business_saas_db'
});

async function check() {
    try {
        await client.connect();
        const usersRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Columns in users table:', usersRes.rows.map(r => r.column_name).join(', '));

        const vendorsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vendors'
        `);
        console.log('Columns in vendors table:', vendorsRes.rows.map(r => r.column_name).join(', '));

        const businessesRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'businesses'
        `);
        console.log('Columns in businesses table:', businessesRes.rows.map(r => r.column_name).join(', '));
        await client.end();
    } catch (err) {
        console.error(err);
    }
}

check();

