import {
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    Req,
    UseInterceptors,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { SearchService } from './search.service';
import { SearchLocationService } from './search-location.service';
import { BroadcastService } from '../notifications/broadcast.service';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { UserRole } from '../../entities/user.entity';
import { SearchBusinessDto } from '../businesses/dto/search-business.dto';

@ApiTags('search')
@Controller({
    path: 'search',
    version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
    private readonly logger = new Logger(SearchController.name);

    constructor(
        private readonly searchService: SearchService,
        private readonly searchLocationService: SearchLocationService,
        private readonly broadcastService: BroadcastService
    ) {
        this.logger.log('🚀 SearchController initialized at /api/v1/search');
    }

    @Public()
    @UseInterceptors(CacheInterceptor)
    @Get()
    @ApiOperation({ summary: 'Search businesses using Elasticsearch or Database fallback' })
    @ApiResponse({ status: 200, description: 'Search results returned' })
    async search(
        @Query() searchDto: SearchBusinessDto,
        @Req() req?: any
    ) {
        // Async broadcast notification (search ko slow nahi karega)
        this.broadcastService
            .handleSearch(searchDto.query || '', req?.user?.id, searchDto.city)
            .catch((err) => {
                console.error('Broadcast handleSearch error:', err);
            });

        return this.searchLocationService.searchHybrid(searchDto);
    }

    @Post('sync')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Re-index all businesses (Admin only)' })
    @ApiResponse({ status: 201, description: 'Sync completed' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async sync() {
        return this.searchService.reindexAll();
    }
}