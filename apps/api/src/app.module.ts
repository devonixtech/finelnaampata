import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitiesModule } from './modules/cities/cities.module';
import { DemandModule } from './modules/demand/demand.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TrustModule } from './modules/trust/trust.module';
import { LocationModule } from './modules/location/location.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsGateway } from './gateways/notifications.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        if (url) {
          return {
            type: 'postgres',
            url,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: configService.get<string>('NODE_ENV') === 'development',
            ssl: { rejectUnauthorized: false },
            extra: {
              max: 20,
              connectionTimeoutMillis: 30000,
              keepalives: true,
              keepalives_idle: 60,
            },
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'your-db-host'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', '5432'),
          database: configService.get<string>('DB_DATABASE', 'business_saas_db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: configService.get<string>('NODE_ENV') === 'development',
          ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CategoriesModule,
    BusinessesModule,
    AuthModule,
    CitiesModule,
    DemandModule,
    ReviewsModule,
    TrustModule,
    LocationModule,
    AffiliateModule,
  ],
  controllers: [AppController],
  providers: [AppService, NotificationsGateway],
})
export class AppModule { }
