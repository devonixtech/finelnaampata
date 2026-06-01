import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Listing } from '../../entities/business.entity';
import { Review } from '../../entities/review.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Transaction } from '../../entities/transaction.entity';

import { SystemSetting } from '../../entities/system-setting.entity';
import { BusinessHours } from '../../entities/business-hours.entity';
import { BusinessAmenity } from '../../entities/business-amenity.entity';
import { Lead } from '../../entities/lead.entity';
import { SavedListing } from '../../entities/favorite.entity';
import { Comment } from '../../entities/comment.entity';
import { Notification } from '../../entities/notification.entity';
import { Subscription } from '../../entities/subscription.entity';
import { CommentReply } from '../../entities/comment-reply.entity';
import { SearchModule } from '../search/search.module';
import { SearchLog } from '../../entities/search-log.entity';
import { AdminSearchController } from './admin-search.controller';
import { Category } from '../../entities/category.entity';
import { City } from '../../entities/city.entity';
import { VendorAttribute } from '../../entities/vendor-attribute.entity';
import { BusinessQuestion } from '../../entities/business-question.entity';
import { LocationModule } from '../location/location.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Listing,
            Review,
            Vendor,
            Transaction,
            SystemSetting,
            BusinessHours,
            BusinessAmenity,
            Lead,
            SavedListing,
            Comment,
            Notification,
            Subscription,
            CommentReply,
            SearchLog,
            Category,
            City,
            VendorAttribute,
            BusinessQuestion,
        ]),
        SearchModule,
        LocationModule,
    ],
    controllers: [AdminController, AdminSearchController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
