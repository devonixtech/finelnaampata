import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Query,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Version,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateVendorDto, UpdateVendorDto, VendorDashboardStatsDto, VendorProfileDto, PublicVendorProfileDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VendorsController {
    constructor(
        private readonly vendorsService: VendorsService,
        private readonly businessesService: BusinessesService,
    ) { }

    @Public()
    @Get(':id/public')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public vendor profile details by ID or Slug' })
    @ApiResponse({ status: 200, description: 'Vendor profile retrieved', type: PublicVendorProfileDto })
    async getPublicProfile(@Param('id') idOrSlug: string, @Res({ passthrough: true }) res: Response) {
        console.log(`[VendorsController] Fetching public profile for: ${idOrSlug}`);
        const profile = await this.vendorsService.getPublicProfile(idOrSlug);
        
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isUuid && profile.slug && profile.slug !== idOrSlug) {
            console.log(`[VendorsController] Redirecting legacy UUID ${idOrSlug} to slug ${profile.slug}`);
            return res.redirect(301, `/api/v1/vendors/${profile.slug}/public`);
        }
        
        return profile;
    }

    @Public()
    @Get('by-city')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public vendor profiles in a given city (no auth required)' })
    @ApiResponse({ status: 200, description: 'Vendor profiles retrieved', type: [PublicVendorProfileDto] })
    getByCity(@Query('city') city: string) {
        return this.vendorsService.getByCity(city || '');
    }

    @Post('become-vendor')
    @ApiOperation({ summary: 'Register the current user as a vendor' })
    @ApiResponse({ status: 201, description: 'Vendor profile created' })
    becomeVendor(@CurrentUser() user: User, @Body() createVendorDto: CreateVendorDto) {
        return this.vendorsService.becomeVendor(user.id, createVendorDto);
    }

    @Get('my-listings')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get current vendor listings' })
    getMyListings(@CurrentUser() user: User) {
        return this.businessesService.getVendorBusinesses(user.id);
    }

    @Get('profile')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get current vendor profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved', type: VendorProfileDto })
    getProfile(@CurrentUser() user: User) {
        return this.vendorsService.getProfile(user.id);
    }

    @Patch('profile')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update current vendor profile' })
    @ApiResponse({ status: 200, description: 'Profile updated', type: VendorProfileDto })
    updateProfile(@CurrentUser() user: User, @Body() updateVendorDto: UpdateVendorDto) {
        return this.vendorsService.updateProfile(user.id, updateVendorDto);
    }

    @Get('dashboard-stats')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get overview stats for the vendor dashboard' })
    @ApiResponse({ status: 200, description: 'Stats retrieved', type: VendorDashboardStatsDto })
    getStats(@CurrentUser() user: User): Promise<VendorDashboardStatsDto> {
        return this.vendorsService.getDashboardStats(user.id) as any;
    }

    @Post('verify')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Submit verification documents' })
    @ApiResponse({ status: 200, description: 'Documents submitted' })
    submitVerification(@CurrentUser() user: User, @Body() documents: any) {
        return this.vendorsService.submitVerification(user.id, documents);
    }

    @Get('analytics/funnel')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get structured funnel analytics (impressions → views → contacts → conversions)' })
    @ApiResponse({ status: 200, description: 'Funnel data returned' })
    getFunnelAnalytics(@CurrentUser() user: User) {
        return this.vendorsService.getFunnelAnalytics(user.id);
    }

    @Get('analytics/keywords')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get keyword performance for vendor listings' })
    @ApiResponse({ status: 200, description: 'Keyword data returned' })
    getKeywordPerformance(@CurrentUser() user: User) {
        return this.vendorsService.getKeywordPerformance(user.id);
    }

    @Get('analytics/follower-growth')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get follower growth over time' })
    @ApiResponse({ status: 200, description: 'Follower growth data returned' })
    getFollowerGrowth(
        @CurrentUser() user: User,
        @Query('days') days?: string,
    ) {
        return this.vendorsService.getFollowerGrowth(user.id, days ? parseInt(days, 10) : 30);
    }

    @Get('analytics/response-trend')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get daily average response time trend' })
    @ApiResponse({ status: 200, description: 'Response time trend returned' })
    getResponseTrend(
        @CurrentUser() user: User,
        @Query('days') days?: string,
    ) {
        return this.vendorsService.getResponseTrend(user.id, days ? parseInt(days, 10) : 30);
    }

    @Get('analytics/offers')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get per-offer breakdown with views and clicks' })
    @ApiResponse({ status: 200, description: 'Offer breakdown returned' })
    getOfferBreakdown(@CurrentUser() user: User) {
        return this.vendorsService.getOfferBreakdown(user.id);
    }

    @Public()
    @Get('slugs/all')
    @ApiOperation({ summary: 'Get all vendor slugs for static generation' })
    getAllSlugs() {
        return this.vendorsService.getAllSlugs();
    }
}
