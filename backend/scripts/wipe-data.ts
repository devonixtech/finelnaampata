import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function bootstrap() {
    console.log('Initializing DataSource directly with DATABASE_URL...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not set in .env');
        process.exit(1);
    }
    
    const dataSource = new DataSource({
        type: 'postgres',
        url: dbUrl,
        ssl: { rejectUnauthorized: false },
        entities: [join(process.cwd(), 'src', 'entities', '**', '*.entity.{ts,js}')],
    });

    await dataSource.initialize();
    
    console.log('Starting specific data wipe process...');

    const tablesToWipe = [
        'saved_offer_events', 'offer_events',
        'deals', 'events',
        'job_lead_responses', 'job_leads', 'leads', 'expert_quotes',
        'review_helpful_votes', 'review_replies', 'reviews',
        'comment_replies', 'comments',
        'follows', 'favorites',
        'chat_messages', 'chat_conversations',
        'promotion_bookings',
        'transactions', 'payouts', 'subscriptions', 'active_plans',
        'business_customer_notes', 'customer_notes',
        'business_questions', 'business_consent_logs',
        'qa_answers', 'qa_questions',
        'business_hours', 'business_amenities',
        'businesses',
        'vendor_attributes', 'vendors',
        'referrals', 'affiliates',
        'notification_logs', 'notifications',
        'search_logs'
    ];

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Disable foreign key constraints temporarily for safe deletion
        await queryRunner.query(`SET session_replication_role = replica;`);

        for (const table of tablesToWipe) {
            console.log(`Clearing table: ${table}`);
            try {
                // Check if table exists first
                const tableExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);
                
                if (tableExists[0].exists) {
                    await queryRunner.query(`DELETE FROM "${table}";`);
                }
            } catch(e) {
                console.log(`Error on table ${table}: ${e.message}`);
            }
        }

        console.log('Clearing regular users (preserving admins & superadmins)...');
        await queryRunner.query(`
            DELETE FROM "users" 
            WHERE role NOT IN ('admin', 'superadmin');
        `);

        // Re-enable constraints
        await queryRunner.query(`SET session_replication_role = origin;`);

        await queryRunner.commitTransaction();
        console.log('Data wipe completed successfully!');
    } catch (error) {
        console.error('Error occurred during data wipe. Rolling back...', error);
        await queryRunner.rollbackTransaction();
        // Try to re-enable constraints even on failure
        await queryRunner.query(`SET session_replication_role = origin;`);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

bootstrap();
