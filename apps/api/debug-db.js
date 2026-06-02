const { Client } = require('pg');
require('dotenv').config();

async function debugDB() {
    const client = new Client({
        host: process.env.DB_HOST || 'your-db-host',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'business_saas_db',
    });

    try {
        await client.connect();
        console.log('âœ… Connected to database');

        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, udt_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);

        console.log('\nðŸ“Š Columns in "users" table:');
        if (res.rows.length === 0) {
            console.log('âŒ "users" table NOT FOUND!');
        } else {
            res.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type}/${row.udt_name}, nullable: ${row.is_nullable})`);
            });
        }

        // Check enum values for role if it's user-defined
        const roleCol = res.rows.find(r => r.column_name === 'role');
        if (roleCol && roleCol.data_type === 'USER-DEFINED') {
            const enumRes = await client.query(`
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = $1
            `, [roleCol.udt_name]);

            console.log(`\nðŸŽ­ Enum values for "${roleCol.udt_name}":`);
            enumRes.rows.forEach(row => {
                console.log(`   - ${row.enumlabel}`);
            });
        }

    } catch (err) {
        console.error('âŒ Error:', err.message);
    } finally {
        await client.end();
    }
}

debugDB();

