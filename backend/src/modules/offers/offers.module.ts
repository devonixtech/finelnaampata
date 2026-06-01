import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OfferEvent } from '../../entities/offer-event.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { PromotionBooking } from '../../entities/promotion-booking.entity';
import { ActivePlan } from '../../entities/active-plan.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DealsModule } from '../deals/deals.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OfferEvent, Listing, Vendor, PromotionBooking, ActivePlan]),
        ConfigModule,
        forwardRef(() => SubscriptionsModule),
        DealsModule,
        EventsModule,
    ],
    controllers: [OffersController],
    providers: [OffersService],
    exports: [OffersService],
})
export class OffersModule { }
