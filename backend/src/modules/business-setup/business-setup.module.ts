import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSetupService } from './business-setup.service';
import { BusinessSetupController } from './business-setup.controller';
import { BusinessQuestion } from '../../entities/business-question.entity';
import { VendorAttribute } from '../../entities/vendor-attribute.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Listing } from '../../entities/business.entity';
import { Subscription } from '../../entities/subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { ActivePlan } from '../../entities/active-plan.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BusinessQuestion,
            VendorAttribute,
            Vendor,
            Listing,
            Subscription,
            SubscriptionPlan,
            ActivePlan,
        ]),
    ],
    controllers: [BusinessSetupController],
    providers: [BusinessSetupService],
    exports: [BusinessSetupService],
})
export class BusinessSetupModule { }
