import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { User } from '../../entities/user.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { SavedOfferEvent } from '../../entities/saved-offer-event.entity';
import { Notification } from '../../entities/notification.entity';
import { Listing } from '../../entities/business.entity';

import { AdminModule } from '../admin/admin.module';
import { Review } from '../../entities/review.entity';
import { TrustService } from './trust.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, SavedListing, SavedOfferEvent, Notification, Listing, Review]),
        SubscriptionsModule,
        AdminModule,
    ],
    controllers: [UsersController],
    providers: [UsersService, TrustService],
    exports: [UsersService, TrustService],
})
export class UsersModule { }
