import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobLeadsService } from './job-leads.service';
import { JobLeadsController } from './job-leads.controller';
import { JobLead, JobLeadResponse, Listing, Vendor, Category } from '../../entities';
import { SystemSetting } from '../../entities/system-setting.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../../entities/user.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            JobLead,
            JobLeadResponse,
            Listing,
            Vendor,
            Category,
            User,
            SystemSetting,
        ]),
        NotificationsModule,
        AuthModule,
        SubscriptionsModule,
    ],
    providers: [JobLeadsService],
    controllers: [JobLeadsController],
    exports: [JobLeadsService],
})
export class JobLeadsModule { }
