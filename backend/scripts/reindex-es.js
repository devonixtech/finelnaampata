const { Client } = require('@elastic/elasticsearch');
const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    console.log('ðŸš€ Starting Elasticsearch Re-indexing...');

    // 1. Initialize Elasticsearch client
    const esClient = new Client({
        node: process.env.ELASTICSEARCH_NODE || 'https://your-elasticsearch-host:9200',
    });

    const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'businesses';

    // 2. Initialize Database connection
    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        entities: [path.join(__dirname, '../dist/**/*.entity.js')],
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('âœ… Database connected');

        // 3. Fetch all businesses
        const businesses = await AppDataSource.query(`
            SELECT b.*, c.name as category_name 
            FROM businesses b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'approved'
        `);

        console.log(`ðŸ“Š Found ${businesses.length} approved businesses to index`);

        // 4. Create/Recreate Index if needed (Optional, but let's just index)
        // Check if index exists
        const exists = await esClient.indices.exists({ index: INDEX_NAME });
        if (!exists) {
            console.log(`Creating index ${INDEX_NAME}...`);
            await esClient.indices.create({
                index: INDEX_NAME,
                body: {
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            title: { type: 'text', analyzer: 'standard' },
                            description: { type: 'text' },
                            category: { type: 'keyword' },
                            city: { type: 'keyword' },
                            location: { type: 'geo_point' },
                            rating: { type: 'float' },
                            isFeatured: { type: 'boolean' },
                            isVerified: { type: 'boolean' },
                            status: { type: 'keyword' },
                            followersCount: { type: 'integer' },
                        },
                    },
                },
            });
        }

        // 5. Index data
        let count = 0;
        for (const b of businesses) {
            await esClient.index({
                index: INDEX_NAME,
                id: b.id,
                body: {
                    id: b.id,
                    title: b.name,
                    description: b.description,
                    category: b.category_name,
                    city: b.city,
                    location: {
                        lat: parseFloat(b.latitude) || 0,
                        lon: parseFloat(b.longitude) || 0,
                    },
                    rating: parseFloat(b.average_rating) || 0,
                    isFeatured: b.is_featured,
                    isVerified: b.is_verified,
                    status: b.status,
                    followersCount: b.followers_count || 0,
                },
            });
            count++;
            if (count % 10 === 0) console.log(`Indexed ${count}/${businesses.length}...`);
        }

        console.log(`âœ… Finished! Indexed ${count} businesses.`);

    } catch (error) {
        console.error('âŒ Error during re-indexing:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

run();

