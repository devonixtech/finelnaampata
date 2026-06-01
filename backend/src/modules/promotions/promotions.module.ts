import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { PromotionPricingRule } from '../../entities/promotion-pricing-rule.entity';
import { PromotionBooking } from '../../entities/promotion-booking.entity';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Deal } from '../../entities/deal.entity';
import { Event } from '../../entities/event.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Listing } from '../../entities/business.entity';
import { PricingPlan } from '../../entities/pricing-plan.entity';
import { Transaction } from '../../entities/transaction.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PromotionPricingRule,
            PromotionBooking,
            OfferEvent,
            Deal,
            Event,
            Vendor,
            Listing,
            PricingPlan,
            Transaction,
        ]),
        forwardRef(() => SubscriptionsModule),
    ],
    controllers: [PromotionsController],
    providers: [PromotionsService],
    exports: [PromotionsService],
})
export class PromotionsModule {}
