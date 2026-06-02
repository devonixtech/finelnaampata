const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    password: '5432',
    host: process.env.DB_HOST || 'your-db-host',
    port: 5432,
    database: 'business_saas_db'
});

async function checkSchema() {
    try {
        await client.connect();
        const tables = ['users', 'vendors', 'categories', 'businesses'];
        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
                ORDER BY ordinal_position
            `);
            res.rows.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));
        }
        await client.end();
    } catch (err) {
        console.error(err);
    }
}

checkSchema();

