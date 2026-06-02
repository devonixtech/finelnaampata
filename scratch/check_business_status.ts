import { createConnection } from 'typeorm';
import { Business } from '../apps/api/src/entities/business.entity';
import { Category } from '../apps/api/src/entities/category.entity';
import { Vendor } from '../apps/api/src/entities/vendor.entity';
import { User } from '../apps/api/src/entities/user.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../apps/api/.env') });

async function check() {
    try {
        const connection = await createConnection({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || 'your-db-host',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '5432',
            database: process.env.DB_DATABASE || 'business_saas_db',
            entities: [Business, Category, Vendor, User],
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        const businessRepo = connection.getRepository(Business);
        const count = await businessRepo.count();
        console.log(`Total businesses in DB: ${count}`);

        const byStatus = await businessRepo.createQueryBuilder('b')
            .select('b.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('b.status')
            .getRawMany();
        
        console.log("Businesses by status:", byStatus);

        const sample = await businessRepo.find({ take: 5 });
        sample.forEach(b => {
            console.log(`- ${b.name} (Status: ${b.status}, Featured: ${b.isFeatured}, Created: ${b.createdAt})`);
        });

        await connection.close();
    } catch (err) {
        console.error('Error connecting to DB:', err);
    }
}

check();

