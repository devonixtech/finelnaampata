const { Client } = require('pg');

const connStr = "postgresql://postgres:RvkwtnMaGpHpXnkqniMeDvRBOKAxihdI@shuttle.proxy.rlwy.net:45505/railway";

async function run() {
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='categories';
        `);
        console.log("FKs referencing categories:", res.rows);
    } catch (e) {
        console.error("DB Query error:", e);
    } finally {
        await client.end();
    }
}

run();
