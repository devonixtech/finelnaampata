import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { Deal } from '../../entities/deal.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { Subscription } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { PromotionBooking } from '../../entities/promotion-booking.entity';
import { ActivePlan } from '../../entities/active-plan.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Deal, Listing, Vendor, PromotionBooking, ActivePlan, User, Subscription, SubscriptionPlan]),
        ConfigModule,
        forwardRef(() => SubscriptionsModule),
    ],
    controllers: [DealsController],
    providers: [DealsService],
    exports: [DealsService, TypeOrmModule],
})
export class DealsModule { }
