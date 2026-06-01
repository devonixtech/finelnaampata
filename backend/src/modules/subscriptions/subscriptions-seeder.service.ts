import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionPlanType } from '../../entities/subscription-plan.entity';

@Injectable()
export class SubscriptionsSeederService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SubscriptionsSeederService.name);

    constructor(
        @InjectRepository(SubscriptionPlan)
        private planRepository: Repository<SubscriptionPlan>,
        private configService: ConfigService,
    ) { }

    async onApplicationBootstrap() {
        const val = this.configService.get('SEED_DATABASE');
        const shouldSeed = String(val) === 'true';
        if (shouldSeed) {
            try {
                await this.seedPlans();
            } catch (err) {
                this.logger.error('❌ Failed to seed subscription plans on startup. Backend will continue to run.', err.stack);
            }
        }
    }

    async seedPlans() {
        this.logger.log('🌱 Starting subscription plans seeding...');

        const plans = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Free',
                planType: SubscriptionPlanType.FREE,
                description: 'Get your business online with a basic profile. No credit card required.',
                price: 0,
                billingCycle: 'monthly',
                dashboardFeatures: {
                    showListings: true,       // can see their 1 listing
                    canAddListing: true,       // can add 1 listing (enforced by maxListings)
                    showSaved: false,
                    showFollowing: false,
                    showQueries: false,
                    showLeads: true,
                    showOffers: true,
                    showReviews: true,
                    showAnalytics: false,
                    showChat: false,
                    showDemand: false,
                    showBroadcast: true,
                    canRespondBroadcast: false,
                    canReplyReviews: false,
                    showCustomerNotes: false,
                    maxKeywords: 0,
                    maxFaqs: 0,
                    maxSubCategories: 0,
                    maxOffers: 1,
                },
                isFeatured: false,
                stripePriceId: null,
                isActive: true,
            },
            {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Business Monthly',
                planType: SubscriptionPlanType.BASIC,
                description: 'Paid monthly plan for businesses that need keywords, FAQs, offers, chat, and up to 3 sub categories.',
                price: 29,
                billingCycle: 'monthly',
                dashboardFeatures: {
                    showListings: true,
                    canAddListing: true,
                    showSaved: true,
                    showFollowing: true,
                    showQueries: true,
                    showLeads: true,
                    showOffers: true,
                    showReviews: true,
                    showAnalytics: true,
                    showChat: true,
                    showDemand: true,
                    showBroadcast: true,
                    canRespondBroadcast: true,
                    canReplyReviews: true,
                    maxListings: 1,
                    maxKeywords: 10,
                    maxFaqs: 10,
                    maxSubCategories: 3,
                    maxOffers: 25,
                    canCreateAlbums: true,
                    maxNamedPhoneNumbers: 5,
                    showCustomerNotes: true,
                },
                isFeatured: false,
                stripePriceId: this.configService.get('STRIPE_BUSINESS_MONTHLY_PRICE_ID') || null,
                isActive: true,
            },
            {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Business Yearly',
                planType: SubscriptionPlanType.BASIC,
                description: 'Paid yearly plan for businesses with the same paid features at annual billing.',
                price: 290,
                billingCycle: 'yearly',
                dashboardFeatures: {
                    showListings: true,
                    canAddListing: true,
                    showSaved: true,
                    showFollowing: true,
                    showQueries: true,
                    showLeads: true,
                    showOffers: true,
                    showReviews: true,
                    showAnalytics: true,
                    showChat: true,
                    showDemand: true,
                    showBroadcast: true,
                    canRespondBroadcast: true,
                    canReplyReviews: true,
                    maxListings: 1,
                    maxKeywords: 10,
                    maxFaqs: 10,
                    maxSubCategories: 3,
                    maxOffers: 25,
                    canCreateAlbums: true,
                    maxNamedPhoneNumbers: 5,
                    showCustomerNotes: true,
                },
                isFeatured: false,
                stripePriceId: this.configService.get('STRIPE_BUSINESS_YEARLY_PRICE_ID') || null,
                isActive: true,
            },
        ];

        // Seeding / Updating
        for (const planData of plans) {
            const existing = await this.planRepository.findOne({
                where: { id: planData.id }
            });

            if (existing) {
                this.logger.log(`Updating dashboard features for plan: ${planData.name} (preserving existing price/name)`);
                // Destructure to exclude fields that only the Admin should control in live DB
                const { price, name, id, ...configOnly } = planData;
                await this.planRepository.update(existing.id, configOnly as any);
            } else {
                this.logger.log(`Creating new plan: ${planData.name} with price ${planData.price}`);
                const plan = this.planRepository.create(planData as any);
                await this.planRepository.save(plan);
            }
        }

        // Deactivate others
        const activeIds = plans.map(p => p.id);
        await this.planRepository.update(
            { id: Not(In(activeIds)) },
            { isActive: false }
        );

        this.logger.log('✅ Subscription plans seeding completed.');
    }
}
