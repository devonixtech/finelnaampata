import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from '../../entities/event.entity';
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
        TypeOrmModule.forFeature([Event, Listing, Vendor, PromotionBooking, ActivePlan, User, Subscription, SubscriptionPlan]),
        ConfigModule,
        forwardRef(() => SubscriptionsModule),
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService, TypeOrmModule],
})
export class EventsModule { }
