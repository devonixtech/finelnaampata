import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewDetectionService } from './review-detection.service';
import { Review } from '../../entities/review.entity';
import { ReviewHelpfulVote } from '../../entities/review-helpful-vote.entity';
import { ReviewReply } from '../../entities/review-reply.entity';
import { Listing } from '../../entities/business.entity';
import { Vendor } from '../../entities/vendor.entity';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminActivityModule } from '../admin/admin-activity.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, ReviewHelpfulVote, ReviewReply, Listing, Vendor, User]),
        UsersModule,
        SubscriptionsModule,
        AdminActivityModule,
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService, ReviewDetectionService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
