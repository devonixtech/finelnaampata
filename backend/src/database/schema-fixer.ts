import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

export async function fixProductionSchema(dataSource: DataSource) {
    const logger = new Logger('SchemaFixer');
    try {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        logger.log('🛠️ Checking and fixing production database schema...');

        // Ensure database extensions are enabled
        try {
            await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        } catch (e) {
            logger.warn('⚠️ PostGIS extension is not available. Spatial features will fall back to earthdistance.');
        }

        try {
            await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        } catch (e) {
            logger.error('❌ Failed to enable pg_trgm extension: ' + e.message);
        }

        // --- SUBSCRIPTION PLANS ---
        const tables = await queryRunner.getTable('subscription_plans');
        if (tables) {
            if (!tables.findColumnByName('stripe_price_id')) {
                logger.log('➕ Adding stripe_price_id to subscription_plans');
                await queryRunner.query('ALTER TABLE subscription_plans ADD COLUMN stripe_price_id VARCHAR(255)');
            }
            if (!tables.findColumnByName('dashboard_features')) {
                logger.log('➕ Adding dashboard_features to subscription_plans');
                await queryRunner.query('ALTER TABLE subscription_plans ADD COLUMN dashboard_features JSONB DEFAULT \'{}\'');
            }
        }

        // --- USERS (OTP VERIFICATION) ---
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            if (!usersTable.findColumnByName('verification_otp')) {
                logger.log('➕ Adding verification_otp to users');
                await queryRunner.query('ALTER TABLE users ADD COLUMN verification_otp VARCHAR(6)');
            }
            if (!usersTable.findColumnByName('otp_expires_at')) {
                logger.log('➕ Adding otp_expires_at to users');
                await queryRunner.query('ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP');
            }
            if (!usersTable.findColumnByName('facebook_id')) {
                logger.log('➕ Adding facebook_id to users');
                await queryRunner.query('ALTER TABLE users ADD COLUMN facebook_id VARCHAR(255)');
                await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id) WHERE facebook_id IS NOT NULL');
            }
        }

        // --- BUSINESSES (LISTINGS) ---
        const bizTable = await queryRunner.getTable('businesses');
        if (bizTable) {
            // Check if PostGIS extension is active
            let hasPostgis = false;
            try {
                const extCheck = await queryRunner.query("SELECT 1 FROM pg_extension WHERE extname = 'postgis'");
                hasPostgis = extCheck.length > 0;
            } catch (e) {
                hasPostgis = false;
            }

            const missingColumns = [
                { name: 'total_views', type: 'integer', default: '0' },
                { name: 'total_leads', type: 'integer', default: '0' },
                { name: 'followers_count', type: 'integer', default: '0' },
                { name: 'is_verified', type: 'boolean', default: 'false' },
                { name: 'is_featured', type: 'boolean', default: 'false' },
                { name: 'is_sponsored', type: 'boolean', default: 'false' },
                { name: 'average_rating', type: 'decimal', precision: '3', scale: '2', default: '0' },
                { name: 'search_keywords', type: 'jsonb', default: '\'[]\'' },
                { name: 'faqs', type: 'jsonb', default: '\'[]\'' },
                { name: 'logo_url', type: 'text', nullable: true },
                { name: 'cover_image_url', type: 'text', nullable: true },
                { name: 'suggested_category_name', type: 'text', nullable: true },
                { name: 'address_line_2', type: 'text', nullable: true },
                { 
                    name: 'location', 
                    type: hasPostgis ? 'geography(Point, 4326)' : 'text', 
                    nullable: true 
                },
                { name: 'legal_consent_accepted', type: 'boolean', default: 'false' },
                { name: 'legal_consent_accepted_at', type: 'timestamp', nullable: true },
                { name: 'legal_consent_ip', type: 'varchar(64)', nullable: true },
                { name: 'legal_consent_session_id', type: 'varchar(128)', nullable: true },
                { name: 'legal_consent_device_id', type: 'varchar(128)', nullable: true },
                { name: 'terms_version', type: 'varchar(32)', nullable: true },
                { name: 'privacy_version', type: 'varchar(32)', nullable: true },
            ];

            for (const col of missingColumns) {
                if (!bizTable.findColumnByName(col.name)) {
                    logger.log(`➕ Adding missing column ${col.name} to businesses`);
                    const type = col.precision ? `${col.type}(${col.precision},${col.scale})` : col.type;
                    const def = col.default !== undefined ? `DEFAULT ${col.default}` : '';
                    await queryRunner.query(`ALTER TABLE businesses ADD COLUMN "${col.name}" ${type} ${def}`);
                }
            }

            // Create PostGIS index and backfill PostGIS location column
            if (hasPostgis) {
                try {
                    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST(location)');
                    await queryRunner.query(`
                        UPDATE businesses 
                        SET location = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography 
                        WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
                    `);
                } catch (err) {
                    logger.error('Failed to create GIST spatial index / backfill location: ' + err.message);
                }
            } else {
                try {
                    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(location)');
                    await queryRunner.query(`
                        UPDATE businesses 
                        SET location = 'POINT(' || longitude || ' ' || latitude || ')' 
                        WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
                    `);
                    // Ensure the earthdistance GIST index is also created
                    await queryRunner.query(`
                        CREATE INDEX IF NOT EXISTS idx_businesses_earthdistance 
                        ON businesses USING gist (ll_to_earth(latitude, longitude));
                    `);
                } catch (err) {
                    logger.error('Failed to create index / backfill location text: ' + err.message);
                }
            }
        }

        // --- DEALS ---
        const dealsTable = await queryRunner.getTable('deals');
        if (!dealsTable) {
            logger.log('➕ Creating deals table');
            await queryRunner.query(`
                CREATE TABLE deals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    offer_badge VARCHAR(255),
                    image_url VARCHAR(255),
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    expiry_date TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'active',
                    is_active BOOLEAN DEFAULT true,
                    is_featured BOOLEAN DEFAULT false,
                    featured_until TIMESTAMP,
                    placements JSONB DEFAULT '[]',
                    highlights JSONB DEFAULT '[]',
                    terms JSONB DEFAULT '[]',
                    pricing_id UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_deals_vendor_id ON deals(vendor_id);
                CREATE INDEX idx_deals_business_id ON deals(business_id);
                CREATE INDEX idx_deals_status ON deals(status);
                CREATE INDEX idx_deals_is_featured ON deals(is_featured);
            `);
        }

        // --- EVENTS ---
        const eventsTable = await queryRunner.getTable('events');
        if (!eventsTable) {
            logger.log('➕ Creating events table');
            await queryRunner.query(`
                CREATE TABLE events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
                    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    image_url VARCHAR(255),
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'active',
                    is_active BOOLEAN DEFAULT true,
                    is_featured BOOLEAN DEFAULT false,
                    featured_until TIMESTAMP,
                    placements JSONB DEFAULT '[]',
                    highlights JSONB DEFAULT '[]',
                    terms JSONB DEFAULT '[]',
                    pricing_id UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_events_vendor_id ON events(vendor_id);
                CREATE INDEX idx_events_business_id ON events(business_id);
                CREATE INDEX idx_events_status ON events(status);
                CREATE INDEX idx_events_is_featured ON events(is_featured);
            `);
        }

        // --- DATA MIGRATION FROM OFFER_EVENTS ---
        const offerEventsTable = await queryRunner.getTable('offer_events');
        if (offerEventsTable) {
            logger.log('🚚 Migrating deals from offer_events...');
            try {
                await queryRunner.query(`
                    INSERT INTO deals (
                        id, vendor_id, business_id, title, description, offer_badge,
                        image_url, start_date, end_date, expiry_date, status,
                        is_active, is_featured, featured_until, placements, highlights, terms,
                        pricing_id, created_at, updated_at
                    )
                    SELECT 
                        id, vendor_id, business_id, title, description, offer_badge,
                        image_url, start_date, end_date, expiry_date, status,
                        is_active, is_featured, featured_until, placements, highlights, terms,
                        pricing_id, created_at, updated_at
                    FROM offer_events
                    WHERE type = 'offer'
                    ON CONFLICT (id) DO NOTHING;
                `);
            } catch (e) {
                logger.warn('⚠️ Deal migration failed or already done: ' + e.message);
            }

            logger.log('🚚 Migrating events from offer_events...');
            try {
                await queryRunner.query(`
                    INSERT INTO events (
                        id, vendor_id, business_id, title, description,
                        image_url, start_date, end_date, status,
                        is_active, is_featured, featured_until, placements, highlights, terms,
                        pricing_id, created_at, updated_at
                    )
                    SELECT 
                        id, vendor_id, business_id, title, description,
                        image_url, start_date, end_date, status,
                        is_active, is_featured, featured_until, placements, highlights, terms,
                        pricing_id, created_at, updated_at
                    FROM offer_events
                    WHERE type = 'event'
                    ON CONFLICT (id) DO NOTHING;
                `);
            } catch (e) {
                logger.warn('⚠️ Event migration failed or already done: ' + e.message);
            }
        }

        // --- PROMOTION BOOKINGS COLS ---
        const promoBookingsTable = await queryRunner.getTable('promotion_bookings');
        if (promoBookingsTable) {
            if (!promoBookingsTable.findColumnByName('deal_id')) {
                logger.log('➕ Adding deal_id to promotion_bookings');
                await queryRunner.query('ALTER TABLE promotion_bookings ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE CASCADE');
                await queryRunner.query('CREATE INDEX idx_promotion_bookings_deal_id ON promotion_bookings(deal_id)');
            }
            if (!promoBookingsTable.findColumnByName('event_id')) {
                logger.log('➕ Adding event_id to promotion_bookings');
                await queryRunner.query('ALTER TABLE promotion_bookings ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE CASCADE');
                await queryRunner.query('CREATE INDEX idx_promotion_bookings_event_id ON promotion_bookings(event_id)');
            }

            try {
                await queryRunner.query('ALTER TABLE promotion_bookings ALTER COLUMN offer_event_id DROP NOT NULL');
            } catch (e) {
                logger.warn('⚠️ Could not make offer_event_id nullable: ' + e.message);
            }

            // Backfill
            logger.log('🚚 Backfilling deal_id and event_id in promotion_bookings...');
            try {
                await queryRunner.query(`
                    UPDATE promotion_bookings
                    SET deal_id = offer_event_id
                    WHERE type = 'offer' AND deal_id IS NULL;
                `);
                await queryRunner.query(`
                    UPDATE promotion_bookings
                    SET event_id = offer_event_id
                    WHERE type = 'event' AND event_id IS NULL;
                `);
            } catch (e) {
                logger.warn('⚠️ Backfilling promotion bookings failed: ' + e.message);
            }
        }

        await queryRunner.release();
        logger.log('✅ Production schema check/fix completed.');
    } catch (err) {
        logger.error('❌ Failed to fix schema automatically: ' + err.stack);
    }
}
