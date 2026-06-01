import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingPlan, PricingPlanType, PricingPlanUnit } from '../../entities/pricing-plan.entity';

@Injectable()
export class PricingPlanSeederService implements OnModuleInit {
    private readonly logger = new Logger(PricingPlanSeederService.name);

    constructor(
        @InjectRepository(PricingPlan)
        private pricingPlanRepo: Repository<PricingPlan>,
    ) {}

    async onModuleInit() {
        if (process.env.SEED_DATABASE === 'true') {
            await this.seed();
        }
    }

    async seed() {
        this.logger.log('🌱 Seeding pricing plans...');

        const plans = [
            // Subscriptions
            {
                name: 'Free',
                type: PricingPlanType.SUBSCRIPTION,
                price: 0,
                duration: 365,
                unit: PricingPlanUnit.DAYS,
                features: { 
                    maxListings: 1, 
                    maxCategories: 1,
                    maxPhotos: 3,
                    canCreateAlbums: false,
                    canChat: false,
                    whatsappIntegration: false,
                    maxKeywords: 0,
                    socialLinks: false,
                    showAnalytics: false,
                    replyToReviews: false,
                    maxFaqs: 0,
                    maxAdditionalPhones: 0,
                    respondToBroadcastLeads: false,
                    customerNotes: false,
                    maxOffers: 0, // Deals are separate add-ons
                    maxEvents: 0, // Events are separate add-ons
                },
                isActive: true,
            },
            {
                name: 'Premium (Monthly)',
                type: PricingPlanType.SUBSCRIPTION,
                price: 4500, // Admin configured
                duration: 1,
                unit: PricingPlanUnit.MONTHS,
                features: { 
                    maxListings: 1, 
                    maxCategories: 4, // 1 primary + 3 subcategories
                    maxPhotos: 999, // unlimited
                    canCreateAlbums: true,
                    canChat: true,
                    whatsappIntegration: true,
                    maxKeywords: 10,
                    socialLinks: true,
                    showAnalytics: true,
                    replyToReviews: true,
                    maxFaqs: 10,
                    maxAdditionalPhones: 5,
                    respondToBroadcastLeads: true,
                    customerNotes: true,
                    maxOffers: 0, // separate add-on
                    maxEvents: 0, // separate add-on
                },
                isActive: true,
            },
            {
                name: 'Premium (Yearly)',
                type: PricingPlanType.SUBSCRIPTION,
                price: 45000, // Admin configured, 2 months free
                duration: 1,
                unit: PricingPlanUnit.YEARS,
                features: { 
                    maxListings: 1, 
                    maxCategories: 4, 
                    maxPhotos: 999, 
                    canCreateAlbums: true,
                    canChat: true,
                    whatsappIntegration: true,
                    maxKeywords: 10,
                    socialLinks: true,
                    showAnalytics: true,
                    replyToReviews: true,
                    maxFaqs: 10,
                    maxAdditionalPhones: 5,
                    respondToBroadcastLeads: true,
                    customerNotes: true,
                    maxOffers: 0, 
                    maxEvents: 0, 
                },
                isActive: true,
            },
            // One-off Boosts
            {
                name: 'Homepage Featured (24 Hours)',
                type: PricingPlanType.HOMEPAGE_FEATURED,
                price: 300,
                duration: 24,
                unit: PricingPlanUnit.HOURS,
                features: { homepage_visibility: true },
                isActive: true,
            },
            {
                name: 'Homepage Featured (7 Days)',
                type: PricingPlanType.HOMEPAGE_FEATURED,
                price: 1500,
                duration: 7,
                unit: PricingPlanUnit.DAYS,
                features: { homepage_visibility: true },
                isActive: true,
            },
            {
                name: 'Category Top Spot (24 Hours)',
                type: PricingPlanType.CATEGORY_FEATURED,
                price: 200,
                duration: 24,
                unit: PricingPlanUnit.HOURS,
                features: { category_visibility: true },
                isActive: true,
            },
            {
                name: 'Listing Boost (1 Hour)',
                type: PricingPlanType.LISTING_BOOST,
                price: 50,
                duration: 1,
                unit: PricingPlanUnit.HOURS,
                features: { top_ranking: true },
                isActive: true,
            },
        ];

        for (const planData of plans) {
            const existing = await this.pricingPlanRepo.findOne({
                where: { name: planData.name, type: planData.type }
            });

            if (!existing) {
                const plan = this.pricingPlanRepo.create(planData);
                await this.pricingPlanRepo.save(plan);
                this.logger.log(`✅ Created plan: ${planData.name}`);
            }
        }

        this.logger.log('✅ Pricing plan seeding complete.');
    }
}
