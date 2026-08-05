import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { BusinessAnalytics } from '../../entities/business-analytics.entity';
import { Business } from '../../entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessAnalytics, Business])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
