const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
    user: 'postgres',
    password: '5432',
    host: process.env.DB_HOST || 'your-db-host',
    port: 5432,
    database: 'business_saas_db'
});

async function seedData() {
    try {
        await client.connect();
        console.log('âœ“ Connected to PostgreSQL');

        // 1. Clear existing data (optional, but good for clean seeding)
        // Order matters due to FK constraints
        console.log('ðŸ§¹ Cleaning existing data...');
        await client.query('DELETE FROM business_images');
        await client.query('DELETE FROM reviews');
        await client.query('DELETE FROM leads');
        await client.query('DELETE FROM businesses');
        await client.query('DELETE FROM vendors');
        await client.query('DELETE FROM users WHERE email != \'aman@gmail.com\'');

        // 2. Insert Users
        console.log('ðŸ‘¤ Seeding users...');
        const users = [
            { id: uuidv4(), email: 'vendor1@example.com', name: 'John Vendor', role: 'vendor' },
            { id: uuidv4(), email: 'vendor2@example.com', name: 'Sarah Listings', role: 'vendor' },
            { id: uuidv4(), email: 'customer1@example.com', name: 'Alice Customer', role: 'user' },
        ];

        for (const u of users) {
            await client.query(
                'INSERT INTO users (id, email, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5)',
                [u.id, u.email, u.name, u.role, true]
            );
        }

        // 3. Insert Vendors
        console.log('ðŸª Seeding vendors...');
        const vendors = [
            { id: uuidv4(), userId: users[0].id, name: 'Johns Enterprises', phone: '1234567890' },
            { id: uuidv4(), userId: users[1].id, name: 'Sarahs Boutique', phone: '9876543210' },
        ];

        for (const v of vendors) {
            await client.query(
                'INSERT INTO vendors (id, user_id, business_name, business_phone, is_verified) VALUES ($1, $2, $3, $4, $5)',
                [v.id, v.userId, v.name, v.phone, true]
            );
        }

        // 4. Get Categories for linking
        const catsRes = await client.query('SELECT id, slug FROM categories');
        const catMap = {};
        catsRes.rows.forEach(c => catMap[c.slug] = c.id);

        // 5. Insert Businesses (Listings)
        console.log('ðŸ“ Seeding business listings...');
        const listings = [
            {
                id: uuidv4(),
                vendorId: vendors[0].id,
                catId: catMap['restaurants'] || catsRes.rows[0].id,
                name: 'The Gourmet Kitchen',
                slug: 'gourmet-kitchen',
                description: 'Best Italian food in town with a modern touch.',
                phone: '555-0101',
                address: '123 Pasta Lane',
                city: 'New York',
                lat: 40.7128,
                lng: -74.0060
            },
            {
                id: uuidv4(),
                vendorId: vendors[0].id,
                catId: catMap['health-beauty'] || catsRes.rows[1].id,
                name: 'Zen Spa & Wellness',
                slug: 'zen-spa',
                description: 'Rejuvenate your soul with our luxury treatments.',
                phone: '555-0202',
                address: '456 Calm Ave',
                city: 'New York',
                lat: 40.7300,
                lng: -73.9950
            },
            {
                id: uuidv4(),
                vendorId: vendors[1].id,
                catId: catMap['shopping'] || catsRes.rows[2].id,
                name: 'Urban Threads',
                slug: 'urban-threads',
                description: 'Contemporary fashion for the modern individual.',
                phone: '555-0303',
                address: '789 Style Blvd',
                city: 'Los Angeles',
                lat: 34.0522,
                lng: -118.2437
            }
        ];

        for (const l of listings) {
            await client.query(
                `INSERT INTO businesses (id, vendor_id, category_id, name, slug, description, phone, address, city, latitude, longitude, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved')`,
                [l.id, l.vendorId, l.catId, l.name, l.slug, l.description, l.phone, l.address, l.city, l.lat, l.lng]
            );

            // Add an image for each
            await client.query(
                'INSERT INTO business_images (id, business_id, image_url, is_primary) VALUES ($1, $2, $3, $4)',
                [uuidv4(), l.id, `https://images.unsplash.com/photo-example-${l.slug}`, true]
            );
        }

        // 6. Insert some Reviews
        console.log('â­ Seeding reviews...');
        await client.query(
            'INSERT INTO reviews (id, business_id, user_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
            [uuidv4(), listings[0].id, users[2].id, 5, 'Absolutely delicious! The lasagna is a must-try.']
        );

        console.log('âœ… Seeding completed successfully!');
        await client.end();
    } catch (err) {
        console.error('âŒ Seeding failed:', err);
        process.exit(1);
    }
}

seedData();

