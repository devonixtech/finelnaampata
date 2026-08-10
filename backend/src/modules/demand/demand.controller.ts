import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DemandService } from './demand.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('demand')
@Controller('demand')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemandController {
    constructor(private readonly demandService: DemandService) { }

    @Public()
    @Post('log')
    @ApiOperation({ summary: 'Log a search event for demand analysis' })
    @ApiResponse({ status: 201, description: 'Search event logged successfully' })
    async logSearch(
        @Body() data: {
            keyword: string;
            city?: string;
            latitude?: number;
            longitude?: number;
            userId?: string;
        }
    ) {
        return this.demandService.logSearch(data);
    }

    @Get('summary-ai')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get AI-generated demand summary' })
    async getAISummary(@Query('city') city?: string) {
        return { summary: await this.demandService.getAIInsightsSummary(city) };
    }

    @Get('insights')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get aggregated demand insights' })
    @ApiResponse({ status: 200, description: 'Demand insights retrieved' })
    async getInsights(@Query('city') city?: string) {
        return this.demandService.getInsights(city);
    }

    @Get('overview')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get comprehensive site demand overview' })
    async getOverview(@Query('city') city?: string) {
        return this.demandService.getOverview(city);
    }

    @Get('nearby')
    @Roles(UserRole.VENDOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get local demand trends for vendor' })
    @ApiResponse({ status: 200, description: 'Nearby demand retrieved' })
    async getNearbyDemand(
        @Query('lat') lat?: string,
        @Query('lng') lng?: string,
    ) {
        try {
            const parsedLat = lat ? parseFloat(lat) : undefined;
            const parsedLng = lng ? parseFloat(lng) : undefined;
            return await this.demandService.getNearbyDemand(parsedLat as number, parsedLng as number);
        } catch (error) {
            console.error('ERROR in getNearbyDemand:', error);
            return [];
        }
    }

    @Get('heatmap')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get demand heatmap data' })
    @ApiResponse({ status: 200, description: 'Heatmap data retrieved' })
    async getHeatmap(
        @Query('keyword') keyword?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.demandService.getHeatmap(keyword, startDate, endDate);
    }
}
