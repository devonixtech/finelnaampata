import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { APP_GUARD } from '@nestjs/core';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CitiesModule } from './modules/cities/cities.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { HealthModule } from './modules/health/health.module';
import { OffersModule } from './modules/offers/offers.module';
import { DealsModule } from './modules/deals/deals.module';
import { EventsModule } from './modules/events/events.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DemandModule } from './modules/demand/demand.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { JobLeadsModule } from './modules/job-leads/job-leads.module';
import { ChatModule } from './modules/chat/chat.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { BusinessSetupModule } from './modules/business-setup/business-setup.module';
import { QaModule } from './modules/qa/qa.module';
import { SearchAnalyticsModule } from './modules/search-analytics/search-analytics.module';
import { AddressConfigModule } from './modules/address/address-config.module';
import { LocationModule } from './modules/location/location.module';

import { typeOrmConfig } from './config/typeorm.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
    imports: [
        // ENV CONFIG (GLOBAL)
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // ✅ DATABASE (CRITICAL FIX AREA)
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                console.log('--- DEBUG: AppModule -> useFactory(TypeOrmModule) called ---');
                return typeOrmConfig(configService);
            },
        }),

        // SCHEDULER
        ScheduleModule.forRoot(),

        // CACHE (REDIS + FALLBACK MEMORY)
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const redisEnabled = configService.get('REDIS_ENABLED') === 'true';
                const ttl =
                    configService.get('REDIS_TTL')
                        ? parseInt(configService.get('REDIS_TTL')) * 1000
                        : 600000;

                if (!redisEnabled) {
                    return { ttl };
                }

                try {
                    const store = await redisStore({
                        socket: {
                            host: configService.get('REDIS_HOST') || 'your-redis-host',
                            port: parseInt(configService.get('REDIS_PORT') || '6379'),
                        },
                    });

                    return { store, ttl };
                } catch (error) {
                    console.error('Redis failed, using memory cache:', error.message);
                    return { ttl };
                }
            },
        }),

        // RATE LIMITING
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => [
                {
                    ttl: parseInt(configService.get('THROTTLE_TTL') || '60'),
                    limit: parseInt(configService.get('THROTTLE_LIMIT') || '100'),
                },
            ],
        }),

        // BACKGROUND JOBS (BULLMQ)
        ...(process.env.REDIS_ENABLED === 'true' ? [
            BullModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: async (configService: ConfigService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST') || 'your-redis-host',
                        port: parseInt(configService.get('REDIS_PORT') || '6379'),
                    },
                }),
            })
        ] : []),

        // FEATURE MODULES
        AuthModule,
        UsersModule,
        VendorsModule,
        CategoriesModule,
        BusinessesModule,
        ReviewsModule,
        LeadsModule,
        SubscriptionsModule,
        SearchModule,
        AdminModule,
        NotificationsModule,
        CitiesModule,
        CloudinaryModule,
        HealthModule,
        OffersModule,
        DealsModule,
        EventsModule,
        CommentsModule,
        DemandModule,
        FollowsModule,
        AffiliateModule,
        JobLeadsModule,
        ChatModule,
        PromotionsModule,
        BusinessSetupModule,
        QaModule,
        SearchAnalyticsModule,
        AddressConfigModule,
        LocationModule,
    ],


    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {
    constructor() {
        console.log('--- DEBUG: APP MODULE INITIALIZED ---');
    }
}




