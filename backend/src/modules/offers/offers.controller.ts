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
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { SearchOfferDto } from './dto/search-offer.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('offers')
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
    constructor(private readonly offersService: OffersService) { }

    /** Public search for offers and events */
    @Public()
    @Get('public/search')
    @ApiOperation({ summary: 'Search all public offers and events' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async findAllPublic(@Query() dto: SearchOfferDto) {
        return this.offersService.findAllPublic(dto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new offer or event (Vendor)' })
    @ApiResponse({ status: 201, description: 'Offer created successfully' })
    create(
        @Body() dto: CreateOfferDto,
        @CurrentUser() user: User,
    ) {
        return this.offersService.create(user.id, dto);
    }
 
    @Get(['vendor', 'owner'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all offers for the authenticated vendor (paginated)' })
    @ApiResponse({ status: 200, description: 'Vendor offers list' })
    findMine(
        @CurrentUser() user: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('type') type?: string,
    ) {
        return this.offersService.findByVendor(user.id, page, limit, type as any);
    }
 
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an offer (Vendor owner only)' })
    @ApiResponse({ status: 200, description: 'Offer updated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your offer' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateOfferDto,
        @CurrentUser() user: User,
    ) {
        return this.offersService.update(id, user.id, dto);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish a draft offer/event after add-on entitlement' })
    publish(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.offersService.publish(id, user.id);
    }
 
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an offer (Vendor owner only)' })
    @ApiResponse({ status: 204, description: 'Offer deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your offer' })
    remove(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.offersService.remove(id, user.id);
    }
 
    // ─── Public Endpoint ─────────────────────────────────────────────────────
 
    @Public()
    @Get('business/:businessId/offers')
    @ApiOperation({ summary: 'Get active/scheduled offers for a business (Public)' })
    @ApiResponse({ status: 200, description: 'Business offers' })
    findByBusiness(@Param('businessId') businessId: string) {
        return this.offersService.findPublicByBusiness(businessId);
    }
 
    @Public()
    @Get('public/:id')
    @ApiOperation({ summary: 'Get a single offer or event by ID (Public)' })
    @ApiResponse({ status: 200, description: 'Offer details' })
    @ApiResponse({ status: 404, description: 'Offer not found' })
    findOnePublic(@Param('id') id: string) {
        return this.offersService.findOnePublic(id);
    }
 
    // ─── Admin Endpoints ─────────────────────────────────────────────────────
 
    @Get('admin/all')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all offers for admin management' })
    @ApiResponse({ status: 200, description: 'All offers retrieved' })
    findAllAdmin(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.offersService.findAllForAdmin(page, limit);
    }
 
    @Patch('admin/:id/feature')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle featured status of an offer' })
    @ApiResponse({ status: 200, description: 'Featured status updated' })
    toggleFeatured(
        @Param('id') id: string,
        @Body('isFeatured') isFeatured: boolean,
    ) {
        return this.offersService.toggleFeatured(id, isFeatured);
    }
}
