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
            url: process.env.DATABASE_URL, // Using URL if available
            host: process.env.DB_HOST || 'your-db-host',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '5432',
            database: process.env.DB_DATABASE || 'business_saas_db',
            entities: [Business, Category, Vendor, User],
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        const businessRepo = connection.getRepository(Business);
        
        console.log("--- DEFAULT SORT (Featured first, then Newest) ---");
        const defaultSort = await businessRepo.createQueryBuilder('business')
            .orderBy('business.isFeatured', 'DESC')
            .addOrderBy('business.createdAt', 'DESC')
            .getMany();
        
        defaultSort.slice(0, 5).forEach(b => {
            console.log(`[${b.isFeatured ? 'FEATURED' : 'NORMAL'}] ${b.name} - Created: ${b.createdAt.toISOString()}`);
        });

        console.log("\n--- NEWEST SORT (CreatedAt first) ---");
        const newestSort = await businessRepo.createQueryBuilder('business')
            .orderBy('business.createdAt', 'DESC')
            .addOrderBy('business.isFeatured', 'DESC')
            .getMany();
        
        newestSort.slice(0, 5).forEach(b => {
            console.log(`[${b.isFeatured ? 'FEATURED' : 'NORMAL'}] ${b.name} - Created: ${b.createdAt.toISOString()}`);
        });

        await connection.close();
    } catch (err) {
        console.error('Error connecting to DB:', err);
    }
}

check();

