import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateController, AdminAffiliateController } from './affiliate.controller';
import { AffiliateService } from './affiliate.service';
import { Affiliate } from '../../entities/affiliate.entity';
import { Commission } from '../../entities/commission.entity';
import { User } from '../../entities/user.entity';
import { BullModule } from '@nestjs/bullmq';
import { CommissionProcessor } from '../bullmq/commission.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Affiliate, Commission, User]),
        BullModule.registerQueue({
            name: 'commissions',
        }),
    ],
    controllers: [AffiliateController, AdminAffiliateController],
    providers: [AffiliateService, CommissionProcessor],
    exports: [AffiliateService],
})
export class AffiliateModule { }
