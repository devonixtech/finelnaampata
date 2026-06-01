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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SearchEventDto } from './dto/search-event.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Public()
    @Get('public/search')
    @ApiOperation({ summary: 'Search all public events' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async findAllPublic(@Query() dto: SearchEventDto) {
        return this.eventsService.findAllPublic(dto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new event (Vendor)' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    create(
        @Body() dto: CreateEventDto,
        @CurrentUser() user: User,
    ) {
        return this.eventsService.create(user.id, dto);
    }

    @Get(['vendor', 'owner'])
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all events for the authenticated vendor (paginated)' })
    @ApiResponse({ status: 200, description: 'Vendor events list' })
    findMine(
        @CurrentUser() user: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.eventsService.findByVendor(user.id, page, limit);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an event (Vendor owner only)' })
    @ApiResponse({ status: 200, description: 'Event updated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your event' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
        @CurrentUser() user: User,
    ) {
        return this.eventsService.update(id, user.id, dto);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish a draft event after add-on entitlement' })
    publish(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.eventsService.publish(id, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an event (Vendor owner only)' })
    @ApiResponse({ status: 204, description: 'Event deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - not your event' })
    remove(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.eventsService.remove(id, user.id);
    }

    @Public()
    @Get('business/:businessId/events')
    @ApiOperation({ summary: 'Get active/scheduled events for a business (Public)' })
    @ApiResponse({ status: 200, description: 'Business events' })
    findByBusiness(@Param('businessId') businessId: string) {
        return this.eventsService.findPublicByBusiness(businessId);
    }

    @Public()
    @Get('public/:id')
    @ApiOperation({ summary: 'Get a single event by ID (Public)' })
    @ApiResponse({ status: 200, description: 'Event details' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    findOnePublic(@Param('id') id: string) {
        return this.eventsService.findOnePublic(id);
    }

    @Get('admin/all')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all events for admin management' })
    @ApiResponse({ status: 200, description: 'All events retrieved' })
    findAllAdmin(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.eventsService.findAllForAdmin(page, limit);
    }

    @Patch('admin/:id/feature')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle featured status of an event' })
    @ApiResponse({ status: 200, description: 'Featured status updated' })
    toggleFeatured(
        @Param('id') id: string,
        @Body('isFeatured') isFeatured: boolean,
    ) {
        return this.eventsService.toggleFeatured(id, isFeatured);
    }
}
