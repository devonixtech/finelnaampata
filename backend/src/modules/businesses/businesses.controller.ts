import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    Inject,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BusinessesService } from './businesses.service';
import { SearchService } from '../search/search.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { SearchBusinessDto } from './dto/search-business.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckFeature } from '../../common/decorators/check-feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeatureGateGuard } from '../../common/guards/feature-gate.guard';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { User, UserRole } from '../../entities/user.entity';
import { Request } from 'express';
import { SearchLocationService } from '../search/search-location.service';

@ApiTags('businesses')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
    constructor(
        private readonly businessesService: BusinessesService,
        private readonly searchService: SearchService,
        private readonly searchLocationService: SearchLocationService,
        private readonly affiliateService: AffiliateService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    @Post()
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.USER)
    @UseGuards(FeatureGateGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new listing (Auto-upgrades User to Business)' })
    @ApiResponse({ status: 201, description: 'Listing created successfully' })
    @ApiResponse({ status: 403, description: 'Only business accounts can create listings' })
    async create(
        @Body() createBusinessDto: CreateBusinessDto,
        @CurrentUser() user: User,
        @Req() req: Request,
    ) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ipAddress = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : String(forwardedFor || req.ip || '').split(',')[0].trim();
        const sessionId = String(req.headers['x-session-id'] || '');
        const deviceId = String(req.headers['x-device-id'] || req.headers['user-agent'] || '');

        const created = await this.businessesService.create(createBusinessDto, user, {
            ipAddress: ipAddress || undefined,
            sessionId: sessionId || undefined,
            deviceId: deviceId || undefined,
        });
        await this.searchLocationService.invalidateCity(created.city);
        await this.searchLocationService.invalidateCityCategory(
            created.city,
            created.category?.slug || created.categoryId || 'all',
        );
        return created;
    }

    @Patch(':id/image')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update business listing image URL' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                imageUrl: {
                    type: 'string',
                    description: 'The Cloudinary URL of the uploaded image',
                },
            },
            required: ['imageUrl'],
        },
    })
    async updateImageUrl(
        @Param('id', ParseUuidPipe) id: string,
        @Body('imageUrl') imageUrl: string,
        @CurrentUser() user: User,
    ) {
        return this.businessesService.updateImage(id, imageUrl, user);
    }

    @Public()
    @Get('search')
    @ApiOperation({ summary: 'Search listings with filters and geo-location' })
    @ApiResponse({ status: 200, description: 'Search results returned' })
    search(@Query() searchDto: SearchBusinessDto) {
        return this.searchLocationService.search(searchDto, () => this.businessesService.search(searchDto));
    }

    @Public()
    @UseInterceptors(CacheInterceptor)
    @Get('search/suggestions')
    @ApiOperation({ summary: 'Search suggestions (text-only, no PostGIS)' })
    @ApiResponse({ status: 200, description: 'Suggestions returned' })
    async searchSuggestions(@Query('q') query: string) {
        return this.businessesService.getSuggestions(query || '');
    }

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @UseInterceptors(CacheInterceptor)
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get listing by slug' })
    @ApiResponse({ status: 200, description: 'Listing found' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    findBySlug(@Param('slug') slug: string, @CurrentUser() user?: User) {
        return this.businessesService.findBySlug(slug, user);
    }

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @UseInterceptors(CacheInterceptor)
    @Get(':id')
    @ApiOperation({ summary: 'Get listing by ID' })
    @ApiResponse({ status: 200, description: 'Listing found' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    findOne(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user?: User) {
        return this.businessesService.findOne(id, user);
    }

    @Patch(':id')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update listing (Owner or Admin only)' })
    @ApiResponse({ status: 200, description: 'Listing updated successfully' })
    @ApiResponse({ status: 403, description: 'Unauthorized access' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    async update(
        @Param('id', ParseUuidPipe) id: string,
        @Body() updateBusinessDto: UpdateBusinessDto,
        @CurrentUser() user: User,
    ) {
        const before = await this.businessesService.getListingSnapshot(id);
        const result = await this.businessesService.update(id, updateBusinessDto, user);

        // Invalidate cache
        try {
            // NestJS CacheInterceptor uses the request URL as the key by default
            const prefix = '/api/v1/businesses';
            await Promise.all([
                this.cacheManager.del(`${prefix}/slug/${result.slug}`),
                this.cacheManager.del(`${prefix}/${id}`),
                // Also clear any cached search results that might be affected
                this.cacheManager.del(`${prefix}/search`)
            ]);
            // For search, since it has query parameters, we can't easily clear specific keys 
            // without a wildcard store. For now, we clear the main entries.
        } catch (err) {
            console.error('Cache Invalidation Error:', err);
        }

        if (before) {
            // Invalidate OLD city/category caches
            await this.searchLocationService.invalidateCity(before.city);
            await this.searchLocationService.invalidateCityCategory(
                before.city,
                before.category?.slug || before.categoryId || 'all',
            );
            // Also invalidate profile cache
            await this.searchLocationService.invalidateBusinessProfile(id, before.slug);
        }

        // Invalidate NEW city/category caches
        await this.searchLocationService.invalidateCity(result.city);
        await this.searchLocationService.invalidateCityCategory(
            result.city,
            result.category?.slug || result.categoryId || 'all',
        );

        return result;
    }

    @Delete(':id')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete listing (Owner or Admin only)' })
    @ApiResponse({ status: 204, description: 'Listing deleted successfully' })
    @ApiResponse({ status: 403, description: 'Unauthorized access' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    async remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        const snapshot = await this.businessesService.getListingSnapshot(id);
        await this.businessesService.remove(id, user);
        if (snapshot) {
            await this.searchLocationService.invalidateCity(snapshot.city);
            await this.searchLocationService.invalidateCityCategory(
                snapshot.city,
                snapshot.category?.slug || snapshot.categoryId || 'all',
            );
        }
    }

    @Get(['vendor/my-listings', 'owner/my-listings'])
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current business listings' })
    @ApiResponse({ status: 200, description: 'Business listings retrieved' })
    getMyBusinesses(
        @CurrentUser() user: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.businessesService.getVendorBusinesses(user.id, page, limit);
    }

    @Public()
    @Get(':idOrSlug/similar')
    @ApiOperation({ summary: 'Get similar listings' })
    @ApiResponse({ status: 200, description: 'Similar listings retrieved' })
    getSimilar(@Param('idOrSlug') idOrSlug: string, @Query('limit') limit?: number) {
        return this.businessesService.getSimilar(idOrSlug, limit);
    }

    @Public()
    @Get('amenities/all')
    @ApiOperation({ summary: 'Get all available amenities' })
    getAllAmenities() {
        return this.businessesService.getAllAmenities();
    }

    @Post('amenities')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new amenity' })
    createAmenity(@Body() data: { name: string, icon?: string }) {
        return this.businessesService.createAmenity(data.name, data.icon);
    }

    @Post('sync')
    @Public()
    async sync() {
        return this.searchService.reindexAll();
    }

    @Get(':id/albums')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List albums for a business listing' })
    getAlbums(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        return this.businessesService.getAlbums(id, user);
    }

    @Post(':id/albums')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create an album (paid plans only)' })
    createAlbum(
        @Param('id', ParseUuidPipe) id: string,
        @CurrentUser() user: User,
        @Body('name') name: string,
    ) {
        return this.businessesService.createAlbum(id, user, name);
    }

    @Patch(':id/albums/:albumId')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Rename an album' })
    renameAlbum(
        @Param('id', ParseUuidPipe) id: string,
        @Param('albumId') albumId: string,
        @CurrentUser() user: User,
        @Body('name') name: string,
    ) {
        return this.businessesService.renameAlbum(id, albumId, user, name);
    }

    @Delete(':id/albums/:albumId')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an album' })
    deleteAlbum(
        @Param('id', ParseUuidPipe) id: string,
        @Param('albumId') albumId: string,
        @CurrentUser() user: User,
    ) {
        return this.businessesService.deleteAlbum(id, albumId, user);
    }

    @Patch(':id/albums/:albumId/images')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Replace/reorder album images and captions' })
    upsertAlbumImages(
        @Param('id', ParseUuidPipe) id: string,
        @Param('albumId') albumId: string,
        @CurrentUser() user: User,
        @Body('images') images: any[],
    ) {
        return this.businessesService.upsertAlbumImages(id, albumId, user, images);
    }

    @Patch(':id/admin/ranking-boost')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Set manual ranking boost for a listing' })
    setRankingBoost(
        @Param('id', ParseUuidPipe) id: string,
        @Body('boost') boost: number,
    ) {
        return this.businessesService.setRankingBoost(id, boost);
    }

    @Get('vendor/keyword-analytics')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get per-keyword analytics for current vendor' })
    getKeywordAnalytics(@CurrentUser() user: User) {
        return (this.businessesService as any).getKeywordAnalytics(user.id);
    }

    @Get('admin/duplicates')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Find potential duplicate businesses' })
    findDuplicateBusinesses() {
        return (this.businessesService as any).findDuplicateBusinesses();
    }

    @Post(':id/user-photos')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit a user photo for a business (pending moderation)' })
    async submitUserPhoto(
        @Param('id', ParseUuidPipe) id: string,
        @Body() body: { url: string; caption?: string },
        @CurrentUser() user: User,
    ) {
        return this.businessesService.submitUserPhoto(id, user, body);
    }

    @Public()
    @Get(':id/user-photos')
    @ApiOperation({ summary: 'Get approved user photos for a business' })
    async getUserPhotos(
        @Param('id', ParseUuidPipe) id: string,
        @Query('approved') approved?: string,
    ) {
        return this.businessesService.getUserPhotos(id, approved !== 'false');
    }

    @Patch(':id/user-photos/:photoId/approve')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Approve a user-submitted photo' })
    async approveUserPhoto(
        @Param('id', ParseUuidPipe) id: string,
        @Param('photoId') photoId: string,
    ) {
        return this.businessesService.approveUserPhoto(id, photoId);
    }

    @Patch(':id/user-photos/:photoId/reject')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Reject/remove a user-submitted photo' })
    async rejectUserPhoto(
        @Param('id', ParseUuidPipe) id: string,
        @Param('photoId') photoId: string,
    ) {
        return this.businessesService.rejectUserPhoto(id, photoId);
    }

    @Post(':id/track/offer-click')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track an offer click on a listing' })
    async trackOfferClick(@Param('id', ParseUuidPipe) id: string) {
        await this.businessesService.trackOfferClick(id);
        return { success: true };
    }

    @Post(':id/track/ad-click')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track an ad click on a sponsored listing' })
    async trackAdClick(@Param('id', ParseUuidPipe) id: string) {
        await this.businessesService.trackAdClick(id);
        return { success: true };
    }

    @Post(':id/track/contact')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track a contact (call/whatsapp) on a listing' })
    async trackContact(@Param('id', ParseUuidPipe) id: string) {
        await this.businessesService.trackContact(id);
        return { success: true };
    }

    @Post(':id/track/conversion')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track a conversion on a listing' })
    async trackConversion(@Param('id', ParseUuidPipe) id: string) {
        await this.businessesService.trackConversion(id);
        return { success: true };
    }

}
