import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { Listing } from '../../entities/business.entity';
import { BusinessHours } from '../../entities/business-hours.entity';
import { BusinessAmenity } from '../../entities/business-amenity.entity';
import { Amenity } from '../../entities/amenity.entity';
import { Category } from '../../entities/category.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { SearchModule } from '../search/search.module';
import { DemandModule } from '../demand/demand.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Subscription } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { AddressConfigModule } from '../address/address-config.module';
import { LocationModule } from '../location/location.module';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';

import { ActivePlan } from '../../entities/active-plan.entity';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { SearchCacheWarmService } from './search-cache-warm.service';
import { GeocodingQueueService } from './geocoding-queue.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Listing,
            BusinessHours,
            BusinessAmenity,
            Amenity,
            Category,
            Vendor,
            User,
            ActivePlan,
            Subscription,
            SubscriptionPlan,
        ]),
        NotificationsModule,
        SearchModule,
        DemandModule,
        AddressConfigModule,
        LocationModule,
        AffiliateModule,
        SubscriptionsModule,
        AuthModule,
        ...(process.env.REDIS_ENABLED === 'true' ? [
            BullModule.registerQueue({
                name: 'search-cache-invalidation',
            })
        ] : []),
    ],
    controllers: [BusinessesController],
    providers: [BusinessesService, DuplicateDetectionService, SearchCacheWarmService, GeocodingQueueService],
    exports: [BusinessesService],
})
export class BusinessesModule { }
