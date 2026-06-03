import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SubscriptionPlan, SubscriptionPlanType } from '../entities/subscription-plan.entity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const useSsl = (process.env.DB_SSL || process.env.DATABASE_SSL || '').toLowerCase() === 'true';

const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    entities: [path.resolve(__dirname, '../entities/*.entity.{ts,js}')],
    synchronize: false,
});

const FREE_FEATURES = {
    showListings: true,
    canAddListing: true,
    showLeads: true,
    showOffers: true,
    showReviews: true,
    showSaved: true,
    showFollowing: false,
    showQueries: false,
    showAnalytics: false,
    showChat: false,
    showBroadcast: false,
    showDemand: false,
    maxKeywords: 0,
    maxListings: 1,
};

const PAID_FEATURES = {
    showListings: true,
    canAddListing: true,
    showLeads: true,
    showOffers: true,
    showReviews: true,
    showSaved: true,
    showFollowing: true,
    showQueries: true,
    showAnalytics: true,
    showChat: true,
    showBroadcast: true,
    showDemand: true,
    maxKeywords: 10,
    maxListings: 999,
    canRespondBroadcast: true,
    canReplyReviews: true,
};

const plans: Array<{ name: string; planType: SubscriptionPlanType; description: string; price: number; billingCycle: string; isFeatured: boolean; isActive: boolean; dashboardFeatures: Record<string, any> }> = [
    {
        name: 'Free',
        planType: SubscriptionPlanType.FREE,
        description: 'Get your business online with a basic profile. No credit card required.',
        price: 0,
        billingCycle: 'monthly',
        isFeatured: false,
        isActive: true,
        dashboardFeatures: FREE_FEATURES,
    },
    {
        name: 'Free (Yearly)',
        planType: SubscriptionPlanType.FREE,
        description: 'Get your business online with a basic profile. No credit card required.',
        price: 0,
        billingCycle: 'yearly',
        isFeatured: false,
        isActive: true,
        dashboardFeatures: FREE_FEATURES,
    },
    {
        name: 'Paid Plan',
        planType: SubscriptionPlanType.BASIC,
        description: 'Everything in Free Plan plus premium features to grow your business. Cancel anytime.',
        price: 1999,
        billingCycle: 'monthly',
        isFeatured: true,
        isActive: true,
        dashboardFeatures: PAID_FEATURES,
    },
    {
        name: 'Paid Plan (Yearly)',
        planType: SubscriptionPlanType.BASIC,
        description: 'Everything in Free Plan plus premium features. Save 2 months when you pay yearly.',
        price: 17990,
        billingCycle: 'yearly',
        isFeatured: false,
        isActive: true,
        dashboardFeatures: PAID_FEATURES,
    },
];

async function seed() {
    await dataSource.initialize();
    console.log('Database connected.');

    const repo = dataSource.getRepository(SubscriptionPlan);

    for (const plan of plans) {
        const existing = await repo.findOne({
            where: { planType: plan.planType, billingCycle: plan.billingCycle },
        });

        if (existing) {
            console.log(`Plan "${plan.name}" (${plan.billingCycle}) already exists — updating.`);
            Object.assign(existing, plan);
            await repo.save(existing);
            console.log(`  -> Updated: ${existing.id}`);
        } else {
            const created = repo.create(plan);
            const saved = await repo.save(created);
            console.log(`Created "${plan.name}" (${plan.billingCycle}): ${saved.id}`);
        }
    }

    console.log('\nAll plans seeded successfully.');
    await dataSource.destroy();
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
