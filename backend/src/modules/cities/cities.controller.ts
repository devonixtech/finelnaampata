import { Controller, Get, Post, Body, Query, Delete, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CitiesService } from './cities.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
    constructor(private readonly citiesService: CitiesService) { }

    @Public()
    @UseInterceptors(CacheInterceptor)
    @Get()
    @ApiOperation({ summary: 'Get all cities' })
    @ApiResponse({ status: 200, description: 'Return all cities' })
    findAll(@Query('country') country?: string) {
        return this.citiesService.findAll(country);
    }

    @Public()
    @UseInterceptors(CacheInterceptor)
    @Get('popular')
    @ApiOperation({ summary: 'Get popular cities' })
    @ApiResponse({ status: 200, description: 'Return popular cities' })
    findPopular() {
        return this.citiesService.findPopular();
    }

    @Public()
    @Get('supported-countries')
    @ApiOperation({ summary: 'Get list of countries available for bulk import' })
    getSupportedCountries() {
        return this.citiesService.getSupportedCountries();
    }

    @Public()
    @Get('countries')
    @ApiOperation({ summary: 'Get distinct countries from city records' })
    @ApiResponse({ status: 200, description: 'Return available countries' })
    getCountries() {
        return this.citiesService.getCountries();
    }

    // --- Admin Endpoints ---
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @Get('admin')
    @ApiOperation({ summary: 'Admin: Get paginated cities list' })
    findAllAdmin(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search = '',
    ) {
        return this.citiesService.findAllAdmin(Number(page), Number(limit), search);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @Post('admin')
    @ApiOperation({ summary: 'Admin: Create a new city' })
    create(@Body() body: any) {
        return this.citiesService.create(body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @Patch('admin/:id')
    @ApiOperation({ summary: 'Admin: Update a city' })
    update(@Param('id') id: string, @Body() body: any) {
        return this.citiesService.update(id, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @Delete('admin/:id')
    @ApiOperation({ summary: 'Admin: Delete a city' })
    remove(@Param('id') id: string) {
        return this.citiesService.remove(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @Post('admin/bulk-import')
    @ApiOperation({ summary: 'Admin: Bulk import cities by country' })
    bulkImport(@Body() body: { country?: string }) {
        const country = body?.country || 'Pakistan';
        return this.citiesService.bulkImportByCountry(country);
    }

    @Public()
    @UseInterceptors(CacheInterceptor)
    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get city by slug' })
    @ApiResponse({ status: 200, description: 'Return city details' })
    @ApiResponse({ status: 404, description: 'City not found' })
    findBySlug(@Param('slug') slug: string) {
        return this.citiesService.findBySlug(slug);
    }
}
