import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { AffiliateQueueService } from './affiliate-queue.service';
import { Affiliate } from '../../entities/affiliate.entity';
import { AffiliateReferral } from '../../entities/referral.entity';
import { Payout } from '../../entities/payout.entity';
import { User } from '../../entities/user.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Subscription } from '../../entities/subscription.entity';
import { ActivePlan } from '../../entities/active-plan.entity';
import { PricingPlan } from '../../entities/pricing-plan.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Listing } from '../../entities/business.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Affiliate,
            AffiliateReferral,
            Payout,
            User,
            SystemSetting,
            Subscription,
            ActivePlan,
            PricingPlan,
            Vendor,
            Listing,
            SubscriptionPlan
        ]),
    ],
    controllers: [AffiliateController],
    providers: [AffiliateService, AffiliateQueueService],
    exports: [AffiliateService],
})
export class AffiliateModule { }
