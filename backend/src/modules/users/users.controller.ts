import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { User } from '../../entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
    getProfile(@CurrentUser() user: User) {
        return this.usersService.getProfile(user.id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateProfile(user.id, updateUserDto);
    }

    @Patch('profile/avatar')
    @ApiOperation({ summary: 'Update current user avatar URL' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                avatarUrl: {
                    type: 'string',
                    description: 'The Cloudinary URL of the uploaded avatar',
                },
            },
            required: ['avatarUrl'],
        },
    })
    @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
    async updateAvatar(@CurrentUser() user: User, @Body('avatarUrl') avatarUrl: string) {
        const updatedUser = await this.usersService.updateAvatar(user.id, avatarUrl);
        return {
            success: true,
            message: 'Avatar updated successfully',
            user: updatedUser
        };
    }

    @Patch('password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change current user password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usersService.changePassword(user.id, changePasswordDto);
    }

    @Get('favorites')
    @ApiOperation({ summary: 'Get current user saved listings' })
    @ApiResponse({ status: 200, description: 'Saved listings retrieved successfully' })
    getFavorites(
        @CurrentUser() user: User,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.usersService.getFavorites(user.id, page, limit);
    }

    @Post('favorites/:businessId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Add business to saved listings' })
    @ApiResponse({ status: 204, description: 'Added to saved listings' })
    addFavorite(
        @CurrentUser() user: User,
        @Param('businessId', ParseUuidPipe) businessId: string,
    ) {
        return this.usersService.addFavorite(user.id, businessId);
    }

    @Delete('favorites/:businessId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove business from saved listings' })
    @ApiResponse({ status: 204, description: 'Removed from saved listings' })
    removeFavorite(
        @CurrentUser() user: User,
        @Param('businessId', ParseUuidPipe) businessId: string,
    ) {
        return this.usersService.removeFavorite(user.id, businessId);
    }

    @Get('saved-offers-events')
    @ApiOperation({ summary: 'Get current user saved offers/events' })
    @ApiResponse({ status: 200, description: 'Saved offers/events retrieved successfully' })
    getSavedOfferEvents(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.getSavedOfferEvents(user.id, parseInt(page) || 1, parseInt(limit) || 20);
    }

    @Post('saved-offers-events/:offerEventId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Save an offer/event' })
    @ApiResponse({ status: 204, description: 'Offer/Event saved successfully' })
    addSavedOfferEvent(
        @CurrentUser() user: User,
        @Param('offerEventId', ParseUuidPipe) offerEventId: string,
    ) {
        return this.usersService.addSavedOfferEvent(user.id, offerEventId);
    }

    @Delete('saved-offers-events/:offerEventId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove saved offer/event' })
    @ApiResponse({ status: 204, description: 'Saved offer/event removed successfully' })
    removeSavedOfferEvent(
        @CurrentUser() user: User,
        @Param('offerEventId', ParseUuidPipe) offerEventId: string,
    ) {
        return this.usersService.removeSavedOfferEvent(user.id, offerEventId);
    }

    @Get('notifications')
    @ApiOperation({ summary: 'Get current user notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    getNotifications(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.getNotifications(user.id, parseInt(page) || 1, parseInt(limit) || 20);
    }

    @Patch('notifications/:id/read')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 204, description: 'Notification marked as read' })
    markNotificationRead(
        @CurrentUser() user: User,
        @Param('id', ParseUuidPipe) id: string,
    ) {
        return this.usersService.markNotificationRead(user.id, id);
    }

    @Delete('profile')
    @ApiOperation({ summary: 'Request account deletion (scheduled for 30 days)' })
    @ApiResponse({ status: 200, description: 'Deletion scheduled successfully' })
    requestDeletion(@CurrentUser() user: User) {
        return this.usersService.requestDeletion(user.id);
    }

    @Post('profile/cancel-deletion')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel scheduled account deletion' })
    @ApiResponse({ status: 200, description: 'Deletion cancelled successfully' })
    cancelDeletion(@CurrentUser() user: User) {
        return this.usersService.cancelDeletion(user.id);
    }

    @Patch('profile/notification-settings')
    @ApiOperation({ summary: 'Update notification settings' })
    updateNotificationSettings(@CurrentUser() user: User, @Body() settings: any) {
        return this.usersService.updateNotificationSettings(user.id, settings);
    }

    @Patch('profile/device-token')
    @ApiOperation({ summary: 'Update device token for push notifications' })
    updateDeviceToken(@CurrentUser() user: User, @Body('token') token: string) {
        return this.usersService.updateDeviceToken(user.id, token);
    }
}
