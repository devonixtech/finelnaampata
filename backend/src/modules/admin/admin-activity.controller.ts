import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminActivityService } from './admin-activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminActivityController {
    constructor(private readonly adminActivityService: AdminActivityService) {}

    @Get('activity')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Get recent admin activity feed' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recent activities to return (default 50, max 200)' })
    @ApiResponse({ status: 200, description: 'Recent activities retrieved' })
    getRecentActivity(@Query('limit') limit?: number) {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
        return this.adminActivityService.getRecentActivities(safeLimit);
    }
}
