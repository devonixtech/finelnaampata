const { Client } = require('pg');

async function updateSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@your-db-host:5432/railway'
    });

    try {
        await client.connect();

        // 1. Add parent_id column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        `);

        // 2. Add icon column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS icon TEXT;
        `);

        // 3. Add image_url column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);

        // 4. Add display_order column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
        `);

        // 5. Add status column (using TEXT for robustness against enum issues)
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        `);

        // 6. Add meta_title column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS meta_title TEXT;
        `);

        // 7. Add meta_description column
        await client.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS meta_description TEXT;
        `);

        console.log('Successfully synchronized ALL category columns to production');
    } catch (err) {
        console.error('Error restoring schema:', err);
    } finally {
        await client.end();
    }
}

updateSchema();

