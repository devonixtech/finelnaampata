const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const CONFIGS = [
    { database: 'local_business_platform', password: '5432' },
    { database: 'business_saas_db', password: '5432' },
    { database: 'local_business_platform', password: 'postgres_password' },
    { database: 'business_saas_db', password: '' }
];

const CITIES = ['Delhi', 'Mumbai', 'Chandigarh', 'Kangra', 'Dharamshala'];

const CATEGORIES = [
    { name: 'Restaurants', slug: 'restaurants-food', icon: 'ChefHat' },
    { name: 'Doctors', slug: 'doctors', icon: 'Stethoscope' },
    { name: 'Beauty & Spa', slug: 'beauty-spa', icon: 'Sparkles' },
    { name: 'Real Estate', slug: 'real-estate', icon: 'Compass' },
    { name: 'Education', slug: 'education', icon: 'Star' },
    { name: 'Home Services', slug: 'home-services-maintenance', icon: 'Wrench' },
    { name: 'Automobile', slug: 'automobile', icon: 'Compass' },
    { name: 'IT & Repair', slug: 'it-repair-maintenance', icon: 'Sliders' }
];

async function tryConnect(config) {
    const client = new Client({
        user: 'postgres',
        password: config.password,
        host: process.env.DB_HOST || 'your-db-host',
        port: 5432,
        database: config.database
    });
    try {
        await client.connect();
        return client;
    } catch (e) {
        return null;
    }
}

async function seed() {
    let client = null;
    console.log('ðŸš€ Attempting to connect to database...');

    for (const config of CONFIGS) {
        console.log(`- Trying ${config.database} with password: ${config.password || '(empty)'}...`);
        client = await tryConnect(config);
        if (client) {
            console.log(`âœ… Connected successfully to ${config.database}!`);
            break;
        }
    }

    if (!client) {
        console.error('âŒ Could not connect to any database configuration.');
        process.exit(1);
    }

    try {
        // 1. Seed Categories
        console.log('ðŸ“‚ Seeding categories...');
        const catMap = {};
        for (const cat of CATEGORIES) {
            const id = uuidv4();
            const existing = await client.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
            if (existing.rows.length > 0) {
                catMap[cat.slug] = existing.rows[0].id;
                console.log(`- Category ${cat.name} already exists.`);
            } else {
                await client.query(
                    'INSERT INTO categories (id, name, slug, description, is_active) VALUES ($1, $2, $3, $4, $5)',
                    [id, cat.name, cat.slug, `Find best ${cat.name} in your area`, true]
                );
                catMap[cat.slug] = id;
                console.log(`- Seeded Category: ${cat.name}`);
            }
        }

        // 2. Seed Vendor
        const existingVendors = await client.query('SELECT id FROM vendors LIMIT 1');
        let vendorId;
        if (existingVendors.rows.length > 0) {
            vendorId = existingVendors.rows[0].id;
        } else {
            console.log('ðŸ‘¤ Creating a default vendor...');
            const userId = uuidv4();
            vendorId = uuidv4();
            await client.query(
                'INSERT INTO users (id, firebase_uid, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
                [userId, 'mock-uid-' + Date.now(), 'vendor@example.com', 'Mockup Vendor', 'vendor']
            );
            await client.query(
                'INSERT INTO vendors (id, user_id, business_name, business_phone, is_verified) VALUES ($1, $2, $3, $4, $5)',
                [vendorId, userId, 'Mockup Business Partners', '9876543210', true]
            );
        }

        // 3. Seed Businesses
        console.log('ðŸ“ Seeding listings...');
        for (const city of CITIES) {
            for (const cat of CATEGORIES) {
                const existing = await client.query(
                    'SELECT id FROM businesses WHERE city = $1 AND category_id = $2 LIMIT 1',
                    [city, catMap[cat.slug]]
                );

                if (existing.rows.length === 0) {
                    const bizId = uuidv4();
                    const bizName = `${city} ${cat.name} Experts`;
                    const bizSlug = `${bizName.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;

                    await client.query(
                        `INSERT INTO businesses (
                            id, vendor_id, category_id, name, slug, 
                            phone, address, city, state, pincode, 
                            latitude, longitude, status, is_verified, is_featured, average_rating, total_reviews
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                        [
                            bizId, vendorId, catMap[cat.slug], bizName, bizSlug,
                            '9999911111', `Sector ${Math.floor(Math.random() * 20)}, ${city}`, city, city, '110001',
                            28.6139, 77.2090, 'approved', true, true, 4.8, 120
                        ]
                    );
                    console.log(`- Seeded business for ${cat.name} in ${city}`);
                }
            }
        }

        console.log('ðŸŽ‰ Seeding complete.');
        await client.end();
    } catch (err) {
        console.error('âŒ Seeding error:', err);
        process.exit(1);
    }
}

seed();

