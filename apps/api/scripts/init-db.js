const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    user: 'postgres',
    password: '5432',
    host: process.env.DB_HOST || 'your-db-host',
    port: 5432,
    database: 'business_saas_db'
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('âœ“ Connected to PostgreSQL database: business_saas_db\n');

        // Read the schema file
        const schemaPath = path.join(__dirname, '../../..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('ðŸ“‹ Executing database schema...\n');

        // Execute the schema
        await client.query(schema);

        console.log('âœ… Database schema setup completed successfully!\n');

        // Verify tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('Created Tables:');
        tablesResult.rows.forEach(row => {
            console.log(`  âœ“ ${row.table_name}`);
        });

        // Verify enums
        const enumsResult = await client.query(`
            SELECT typname 
            FROM pg_type 
            WHERE typtype = 'e' 
            ORDER BY typname
        `);

        console.log('\nCreated ENUMs:');
        enumsResult.rows.forEach(row => {
            console.log(`  âœ“ ${row.typname}`);
        });

        await client.end();
        console.log('\nâœ… Database is ready for use!');
    } catch (err) {
        console.error('âŒ Error:', err.message);
        console.error('\nFull error:', err);
        process.exit(1);
    }
}

setupDatabase();

