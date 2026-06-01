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
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { BusinessesService } from '../businesses/businesses.service';
import {
    CreateVendorDto,
    UpdateVendorDto,
    VendorDashboardStatsDto,
    VendorProfileDto,
    PublicVendorProfileDto,
} from './dto/vendor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../../entities/user.entity';

/** Canonical business-owner profile API (replaces legacy /vendors routes). */
@ApiTags('business-profiles')
@Controller('business-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessProfilesController {
    constructor(
        private readonly vendorsService: VendorsService,
        private readonly businessesService: BusinessesService,
    ) {}

    @Public()
    @Get(':id/public')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public business profile by ID or slug' })
    @ApiResponse({ status: 200, description: 'Business profile retrieved', type: PublicVendorProfileDto })
    async getPublicProfile(@Param('id') idOrSlug: string, @Res({ passthrough: true }) res: Response) {
        const profile = await this.vendorsService.getPublicProfile(idOrSlug);

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isUuid && profile.slug && profile.slug !== idOrSlug) {
            return res.redirect(301, `/api/v1/business-profiles/${profile.slug}/public`);
        }

        return profile;
    }

    @Public()
    @Get('by-city')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public business profiles in a city' })
    @ApiResponse({ status: 200, description: 'Business profiles retrieved', type: [PublicVendorProfileDto] })
    getByCity(@Query('city') city: string) {
        return this.vendorsService.getByCity(city || '');
    }

    @Post('register')
    @ApiOperation({ summary: 'Register the current user as a business owner' })
    @ApiResponse({ status: 201, description: 'Business profile created' })
    registerBusiness(@CurrentUser() user: User, @Body() createVendorDto: CreateVendorDto) {
        return this.vendorsService.becomeVendor(user.id, createVendorDto);
    }

    @Get('my-listings')
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get current business listings' })
    getMyListings(@CurrentUser() user: User) {
        return this.businessesService.getVendorBusinesses(user.id);
    }

    @Get('profile')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get current business owner profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved', type: VendorProfileDto })
    getProfile(@CurrentUser() user: User) {
        return this.vendorsService.getProfile(user.id);
    }

    @Patch('profile')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update current business owner profile' })
    @ApiResponse({ status: 200, description: 'Profile updated', type: VendorProfileDto })
    updateProfile(@CurrentUser() user: User, @Body() updateVendorDto: UpdateVendorDto) {
        return this.vendorsService.updateProfile(user.id, updateVendorDto);
    }

    @Get('dashboard-stats')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get overview stats for the business dashboard' })
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

    @Public()
    @Get('slugs/all')
    @ApiOperation({ summary: 'Get all business profile slugs for static generation' })
    getAllSlugs() {
        return this.vendorsService.getAllSlugs();
    }
}
