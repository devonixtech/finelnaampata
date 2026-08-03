import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchAnalyticsController } from './search-analytics.controller';
import { SearchLog } from '../../entities/search-log.entity';
import { Listing } from '../../entities/business.entity';
import { Category } from '../../entities/category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SearchLog, Listing, Category])],
    controllers: [SearchAnalyticsController],
    providers: [SearchAnalyticsService],
})
export class SearchAnalyticsModule {}
