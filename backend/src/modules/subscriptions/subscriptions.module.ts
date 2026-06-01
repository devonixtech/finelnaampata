import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { Subscription } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { PricingPlan } from '../../entities/pricing-plan.entity';
import { ActivePlan } from '../../entities/active-plan.entity';
import { Transaction } from '../../entities/transaction.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { Affiliate } from '../../entities/affiliate.entity';
import { AffiliateReferral } from '../../entities/referral.entity';
import { Listing } from '../../entities/business.entity';
import { SubscriptionsSeederService } from './subscriptions-seeder.service';
import { PricingPlanSeederService } from './pricing-plan-seeder.service';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';
import { OffersModule } from '../offers/offers.module';
import { DealsModule } from '../deals/deals.module';
import { EventsModule } from '../events/events.module';
import { PromotionsModule } from '../promotions/promotions.module';



@Module({
    imports: [
        TypeOrmModule.forFeature([
            Subscription,
            SubscriptionPlan,
            PricingPlan,
            ActivePlan,
            Transaction,
            Vendor,
            User,
            Affiliate,
            AffiliateReferral,
            Listing,
            OfferEvent,
            Deal,
            Event,
        ]),
        AffiliateModule,
        OffersModule,
        DealsModule,
        EventsModule,
        forwardRef(() => PromotionsModule),
    ],
    controllers: [SubscriptionsController],
    providers: [
        SubscriptionsService, 
        SubscriptionsSeederService, 
        PricingPlanSeederService, 
        SubscriptionCronService
    ],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
