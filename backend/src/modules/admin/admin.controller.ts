import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ModerateBusinessDto, ModerateReviewDto } from './dto/moderate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get global site statistics' })
    @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
    getStats() {
        return this.adminService.getGlobalStats();
    }

    @Get('event-deal-payments')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Get event and deal payment history' })
    @ApiResponse({ status: 200, description: 'Event and deal payments retrieved' })
    getEventDealPayments() {
        return this.adminService.getEventDealPayments();
    }

    @Get('heatmap-data')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Get search heatmap data' })
    @ApiResponse({ status: 200, description: 'Heatmap data retrieved successfully' })
    getHeatmapData(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.adminService.getHeatmapData(startDate, endDate);
    }

    @Patch('business/:id/moderate')
    @ApiOperation({ summary: 'Approve, reject, or suspend a business' })
    @ApiResponse({ status: 200, description: 'Business status updated' })
    moderateBusiness(
        @Param('id', ParseUuidPipe) id: string,
        @Body() dto: ModerateBusinessDto,
    ) {
        return this.adminService.moderateBusiness(id, dto);
    }

    @Patch('review/:id/moderate')
    @ApiOperation({ summary: 'Approve or hide a review' })
    @ApiResponse({ status: 200, description: 'Review status updated' })
    moderateReview(
        @Param('id', ParseUuidPipe) id: string,
        @Body() dto: ModerateReviewDto,
    ) {
        return this.adminService.moderateReview(id, dto);
    }


    @Get('users')
    @ApiOperation({ summary: 'Get all user records' })
    @ApiResponse({ status: 200, description: 'Full user list retrieved' })
    getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getAllUsers(page, limit);
    }

    @Get('users/:id')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Get complete user details for superadmin' })
    @ApiResponse({ status: 200, description: 'User details retrieved' })
    getUserDetails(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.getUserDetails(id);
    }

    @Get('users/:id/conversations')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Get customer and business conversations for a user' })
    @ApiResponse({ status: 200, description: 'User conversations retrieved' })
    getUserConversations(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.getUserConversations(id);
    }

    @Patch('users/:id/role')
    @Roles(UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Update a user role' })
    @ApiResponse({ status: 200, description: 'Role updated' })
    updateUserRole(
        @Param('id', ParseUuidPipe) id: string,
        @Body('role') role: string,
    ) {
        return this.adminService.updateUserRole(id, role as any);
    }

    @Patch('users/:id/status')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Toggle user active status' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    toggleUserStatus(
        @Param('id', ParseUuidPipe) id: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.adminService.toggleUserStatus(id, isActive);
    }

    @Delete('users/:id')
    @Roles(UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Delete a user and all related data' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    deleteUser(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.deleteUser(id);
    }

    @Post('users/:id/schedule-deletion')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Schedule a user for deletion in 30 days' })
    @ApiResponse({ status: 200, description: 'Deletion scheduled' })
    scheduleUserDeletion(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.scheduleUserDeletion(id);
    }

    @Post('users/:id/cancel-deletion')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Cancel a scheduled user deletion' })
    @ApiResponse({ status: 200, description: 'Deletion cancelled' })
    cancelUserDeletion(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.cancelUserDeletion(id);
    }

    @Get('businesses')
    @ApiOperation({ summary: 'Get all businesses with filters' })
    @ApiResponse({ status: 200, description: 'Business list retrieved' })
    getBusinesses(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getAllBusinesses(page, limit, status as any, search);
    }

    @Delete('businesses/:id')
    @Roles(UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Delete a business listing' })
    @ApiResponse({ status: 200, description: 'Business deleted' })
    deleteBusiness(@Param('id', ParseUuidPipe) id: string) {
        return this.adminService.deleteBusiness(id);
    }

    @Get('vendors')
    @ApiOperation({ summary: 'Get all vendors with filters' })
    @ApiResponse({ status: 200, description: 'Vendor list retrieved' })
    getVendors(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('isVerified') isVerified?: string,
        @Query('search') search?: string,
    ) {
        const verified = isVerified === 'true' ? true : isVerified === 'false' ? false : undefined;
        return this.adminService.getAllVendors(page, limit, verified, search);
    }

    @Post('vendor/:id/verify')
    @Roles(UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Verify or unverify a vendor' })
    @ApiResponse({ status: 200, description: 'Vendor verification status updated' })
    verifyVendor(
        @Param('id', ParseUuidPipe) id: string,
        @Query('status') status: string,
    ) {
        return this.adminService.verifyVendor(id, status === 'true');
    }

    @Patch('business/:id/featured')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Toggle business featured status' })
    @ApiResponse({ status: 200, description: 'Business featured status updated' })
    toggleFeatured(
        @Param('id', ParseUuidPipe) id: string,
        @Body('isFeatured') isFeatured: boolean,
    ) {
        return this.adminService.toggleFeatured(id, isFeatured);
    }

    @Patch('business/:id/verify-listing')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Toggle business verification status' })
    @ApiResponse({ status: 200, description: 'Business verification status updated' })
    toggleVerifiedListing(
        @Param('id', ParseUuidPipe) id: string,
        @Body('isVerified') isVerified: boolean,
    ) {
        return this.adminService.toggleVerifiedListing(id, isVerified);
    }

    @Patch('business/:id/search-keywords')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update business search keywords' })
    @ApiResponse({ status: 200, description: 'Business search keywords updated' })
    updateSearchKeywords(
        @Param('id', ParseUuidPipe) id: string,
        @Body('keywords') keywords: string[],
    ) {
        return this.adminService.updateSearchKeywords(id, keywords);
    }

    @Get('settings')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all system settings' })
    @ApiResponse({ status: 200, description: 'Settings retrieved' })
    getSettings() {
        return this.adminService.getSettings();
    }

    @Patch('settings')
    @Roles(UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Update system settings' })
    @ApiResponse({ status: 200, description: 'Settings updated' })
    updateSettings(@Body() settings: Record<string, string>) {
        return this.adminService.updateSettings(settings);
    }

}
