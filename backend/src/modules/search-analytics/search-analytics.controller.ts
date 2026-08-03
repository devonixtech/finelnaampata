import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchAnalyticsService } from './search-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('admin/search-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
export class SearchAnalyticsController {
    constructor(private readonly searchAnalyticsService: SearchAnalyticsService) {}

    @Get('overview')
    getOverview(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('city') city?: string,
    ) {
        return this.searchAnalyticsService.getOverview(startDate, endDate, city);
    }

    @Get('top-keywords')
    getTopKeywords(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('city') city?: string,
        @Query('limit') limit?: number,
    ) {
        return this.searchAnalyticsService.getTopKeywords(startDate, endDate, city, limit || 10);
    }

    @Get('top-cities')
    getTopCities(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: number,
    ) {
        return this.searchAnalyticsService.getTopCities(startDate, endDate, limit || 10);
    }

    @Get('no-results')
    getNoResults(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('city') city?: string,
        @Query('limit') limit?: number,
    ) {
        return this.searchAnalyticsService.getNoResults(startDate, endDate, city, limit || 10);
    }

    @Get('trends')
    getTrends(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('city') city?: string,
    ) {
        return this.searchAnalyticsService.getTrends(startDate, endDate, city);
    }

    @Get('underserved-categories')
    getUnderservedCategories() {
        return this.searchAnalyticsService.getUnderservedCategories();
    }
}
