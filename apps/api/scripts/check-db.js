const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    password: '5432',
    host: process.env.DB_HOST || 'your-db-host',
    port: 5432,
    database: 'business_saas_db'
});

async function checkDatabase() {
    try {
        await client.connect();
        console.log('âœ“ Connected to PostgreSQL database: business_saas_db\n');

        // Check existing tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('Existing Tables:');
        if (tablesResult.rows.length === 0) {
            console.log('  (No tables found)');
        } else {
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        // Check existing enums
        const enumsResult = await client.query(`
            SELECT typname 
            FROM pg_type 
            WHERE typtype = 'e' 
            ORDER BY typname
        `);

        console.log('\nExisting ENUMs:');
        if (enumsResult.rows.length === 0) {
            console.log('  (No enums found)');
        } else {
            enumsResult.rows.forEach(row => {
                console.log(`  - ${row.typname}`);
            });
        }

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkDatabase();

