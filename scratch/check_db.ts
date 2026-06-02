import { createConnection } from 'typeorm';
import { Business } from './apps/api/src/entities/business.entity';
import { Category } from './apps/api/src/entities/category.entity';
import { Vendor } from './apps/api/src/entities/vendor.entity';
import { User } from './apps/api/src/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/api/.env' });

async function check() {
    try {
        const connection = await createConnection({
            type: 'postgres',
            host: process.env.DB_HOST || 'your-db-host',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '5432',
            database: process.env.DB_DATABASE || 'business_saas_db',
            entities: [Business, Category, Vendor, User],
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        const businessRepo = connection.getRepository(Business);
        const allBusinesses = await businessRepo.find();
        console.log(`Total businesses: ${allBusinesses.length}`);
        
        const featured = allBusinesses.filter(b => b.isFeatured === true);
        console.log(`Featured businesses: ${featured.length}`);
        featured.forEach(b => console.log(` - ${b.title} (ID: ${b.id})`));

        await connection.close();
    } catch (err) {
        console.error('Error connecting to DB:', err);
    }
}

check();

