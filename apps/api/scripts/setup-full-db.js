const { Client } = require('pg');

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

        console.log('ðŸ“‹ Setting up database schema...\n');

        // Enable UUID extension
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
        console.log('âœ“ Extensions enabled');

        // Create ENUMs
        console.log('âœ“ Creating ENUMs...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('user', 'vendor', 'admin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE business_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE lead_type AS ENUM ('call', 'whatsapp', 'email', 'chat', 'website');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'lost');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'suspended');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        console.log('âœ“ ENUMs created');

        // Update existing tables to add missing columns
        console.log('âœ“ Updating existing tables...');

        // Update users table
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS password VARCHAR(255);
        `);

        await client.query(`
            ALTER TABLE users 
            ALTER COLUMN firebase_uid DROP NOT NULL;
        `);

        // Create reviews table
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(255),
                comment TEXT,
                images JSONB,
                is_verified BOOLEAN DEFAULT false,
                helpful_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(business_id, user_id)
            );
        `);

        // Create leads table
        await client.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                type lead_type NOT NULL,
                status lead_status DEFAULT 'new',
                customer_name VARCHAR(255),
                customer_phone VARCHAR(20),
                customer_email VARCHAR(255),
                message TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create favorites table
        await client.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, business_id)
            );
        `);

        // Create subscriptions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                plan subscription_plan NOT NULL,
                status subscription_status DEFAULT 'active',
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                auto_renew BOOLEAN DEFAULT true,
                features JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create transactions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'INR',
                status payment_status DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_gateway VARCHAR(50),
                transaction_id VARCHAR(255),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create business_hours table
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_hours (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                day day_of_week NOT NULL,
                is_open BOOLEAN DEFAULT true,
                open_time TIME,
                close_time TIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(business_id, day)
            );
        `);

        // Create business_images table
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_images (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                caption VARCHAR(255),
                display_order INTEGER DEFAULT 0,
                is_primary BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create amenities table
        await client.query(`
            CREATE TABLE IF NOT EXISTS amenities (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                icon_url TEXT,
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create business_amenities junction table
        await client.query(`
            CREATE TABLE IF NOT EXISTS business_amenities (
                business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (business_id, amenity_id)
            );
        `);

        // Create notifications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                data JSONB,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create analytics_events table
        await client.query(`
            CREATE TABLE IF NOT EXISTS analytics_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
                event_type VARCHAR(50) NOT NULL,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                metadata JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('âœ“ All tables created/updated');

        // Create indexes
        console.log('âœ“ Creating indexes...');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_favorites_business_id ON favorites(business_id);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor_id ON subscriptions(vendor_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_business_id ON analytics_events(business_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);`);

        console.log('âœ“ Indexes created');

        // Verify setup
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\nâœ… Database setup completed!\n');
        console.log('Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log(`  âœ“ ${row.table_name}`);
        });

        await client.end();
        console.log('\nðŸŽ‰ Database is ready for use!');
    } catch (err) {
        console.error('âŒ Error:', err.message);
        console.error('\nDetails:', err);
        process.exit(1);
    }
}

setupDatabase();

