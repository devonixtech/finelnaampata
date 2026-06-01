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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { SearchDealDto } from './dto/search-deal.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

    @Public()
    @Get('public/search')
    @ApiOperation({ summary: 'Search all public deals' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async findAllPublic(@Query() dto: SearchDealDto) {
        return this.dealsService.findAllPublic(dto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new deal (Vendor)' })
    @ApiResponse({ status: 201, description: 'Deal created successfully' })
    create(
        @Body() dto: CreateDealDto,
        @CurrentUser() user: User,
    ) {
        return this.dealsService.create(user.id, dto);
    }

    @Get(['vendor', 'owner'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all deals for the authenticated vendor (paginated)' })
    @ApiResponse({ status: 200, description: 'Vendor deals list' })
    findMine(
        @CurrentUser() user: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.dealsService.findByVendor(user.id, page, limit);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a deal (Vendor owner only)' })
    @ApiResponse({ status: 200, description: 'Deal updated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your deal' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateDealDto,
        @CurrentUser() user: User,
    ) {
        return this.dealsService.update(id, user.id, dto);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish a draft deal after add-on entitlement' })
    publish(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.dealsService.publish(id, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a deal (Vendor owner only)' })
    @ApiResponse({ status: 204, description: 'Deal deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your deal' })
    remove(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.dealsService.remove(id, user.id);
    }

    @Public()
    @Get('business/:businessId/deals')
    @ApiOperation({ summary: 'Get active/scheduled deals for a business (Public)' })
    @ApiResponse({ status: 200, description: 'Business deals' })
    findByBusiness(@Param('businessId') businessId: string) {
        return this.dealsService.findPublicByBusiness(businessId);
    }

    @Public()
    @Get('public/:id')
    @ApiOperation({ summary: 'Get a single deal by ID (Public)' })
    @ApiResponse({ status: 200, description: 'Deal details' })
    @ApiResponse({ status: 404, description: 'Deal not found' })
    findOnePublic(@Param('id') id: string) {
        return this.dealsService.findOnePublic(id);
    }

    @Get('admin/all')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all deals for admin management' })
    @ApiResponse({ status: 200, description: 'All deals retrieved' })
    findAllAdmin(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.dealsService.findAllForAdmin(page, limit);
    }

    @Patch('admin/:id/feature')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle featured status of a deal' })
    @ApiResponse({ status: 200, description: 'Featured status updated' })
    toggleFeatured(
        @Param('id') id: string,
        @Body('isFeatured') isFeatured: boolean,
    ) {
        return this.dealsService.toggleFeatured(id, isFeatured);
    }
}
