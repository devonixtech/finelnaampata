import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobLeadsService } from './job-leads.service';
import { CreateJobLeadDto } from './dto/create-job-lead.dto';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('broadcasts')
@Controller('broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobLeadsController {
    constructor(private readonly jobLeadsService: JobLeadsService) { }

    @Post()
    @ApiOperation({ summary: 'Post a new job lead' })
    @ApiResponse({ status: 201, description: 'Job lead posted successfully' })
    async create(@CurrentUser() user: User, @Body() dto: CreateJobLeadDto) {
        return this.jobLeadsService.createLead(user.id, dto);
    }

    @Get('my-leads')
    @ApiOperation({ summary: 'Get job leads posted by current user' })
    @ApiResponse({ status: 200, description: 'User leads retrieved' })
    async getMyLeads(@CurrentUser() user: User) {
        return this.jobLeadsService.getMyLeads(user.id);
    }

    @Get(['vendor/inbox', 'business/inbox'])
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get relevant job leads for vendor' })
    @ApiResponse({ status: 200, description: 'Vendor inbox retrieved' })
    async getVendorInbox(@CurrentUser() user: User) {
        return this.jobLeadsService.getLeadsForVendor(user.id);
    }

    @Get(['vendor/stats', 'business/stats'])
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get broadcast inbox statistics (new/unresponded)' })
    @ApiResponse({ status: 200, description: 'Stats retrieved' })
    async getStats(@CurrentUser() user: User) {
        return this.jobLeadsService.getVendorInboxStats(user.id);
    }

    @Post(':id/respond')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Vendor responds/quotes to a job lead' })
    @ApiResponse({ status: 201, description: 'Response submitted' })
    async respond(
        @Param('id', ParseUuidPipe) id: string,
        @CurrentUser() user: User,
        @Body() dto: CreateJobResponseDto,
    ) {
        return this.jobLeadsService.submitResponse(user.id, id, dto);
    }

    @Get(':id/responses')
    @ApiOperation({ summary: 'Get all responses for a specific job lead' })
    @ApiResponse({ status: 200, description: 'Lead responses retrieved' })
    async getResponses(
        @Param('id', ParseUuidPipe) id: string,
        @CurrentUser() user: User,
    ) {
        return this.jobLeadsService.getResponsesForLead(user.id, id);
    }
}
