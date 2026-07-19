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
    Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { User, UserRole } from '../../entities/user.entity';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post(':id/replies')
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reply to a review' })
    @ApiResponse({ status: 201, description: 'Reply created successfully' })
    createReply(
        @Param('id', ParseUuidPipe) id: string,
        @Body() createReviewReplyDto: CreateReviewReplyDto,
        @CurrentUser() user: User,
    ) {
        return this.reviewsService.createReply(id, createReviewReplyDto, user);
    }

    @Public()
    @Get(':id/replies')
    @ApiOperation({ summary: 'Get replies for a review' })
    @ApiResponse({ status: 200, description: 'Replies retrieved successfully' })
    findReplies(@Param('id', ParseUuidPipe) id: string) {
        return this.reviewsService.findReplies(id);
    }

    @Post()
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a review' })
    @ApiResponse({ status: 201, description: 'Review created successfully' })
    @ApiResponse({ status: 409, description: 'You have already reviewed this business' })
    create(
        @Body() createReviewDto: CreateReviewDto, 
        @CurrentUser() user: User,
        @Ip() ip: string,
    ) {
        return this.reviewsService.create(createReviewDto, user, ip);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get reviews with filters' })
    @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
    findAll(@Query() getReviewsDto: GetReviewsDto) {
        return this.reviewsService.findAll(getReviewsDto);
    }

    @Get(['vendor/all', 'business/all'])
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all reviews for the current vendor businesses' })
    @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
    findVendorReviews(
        @CurrentUser() user: User,
        @Query() query: GetReviewsDto,
    ) {
        return this.reviewsService.findVendorReviews(user.id, query);
    }

    @Public()
    @Get('business/:idOrSlug/stats')
    @ApiOperation({ summary: 'Get business rating statistics' })
    @ApiResponse({ status: 200, description: 'Rating statistics retrieved' })
    getBusinessRatingStats(@Param('idOrSlug') idOrSlug: string) {
        return this.reviewsService.getBusinessRatingStats(idOrSlug);
    }

    @Public()
    @Get('business/:idOrSlug')
    @ApiOperation({ summary: 'Get reviews by business ID or slug' })
    @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
    findByBusiness(
        @Param('idOrSlug') idOrSlug: string,
        @Query() getReviewsDto: GetReviewsDto,
    ) {
        return this.reviewsService.findByBusiness(idOrSlug, getReviewsDto);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get review by ID' })
    @ApiResponse({ status: 200, description: 'Review found' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    findOne(@Param('id', ParseUuidPipe) id: string) {
        return this.reviewsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update review (Owner or Admin only)' })
    @ApiResponse({ status: 200, description: 'Review updated successfully' })
    @ApiResponse({ status: 403, description: 'You can only update your own reviews' })
    update(
        @Param('id', ParseUuidPipe) id: string,
        @Body() updateReviewDto: UpdateReviewDto,
        @CurrentUser() user: User,
    ) {
        return this.reviewsService.update(id, updateReviewDto, user);
    }

    @Delete(':id')
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete review (Owner or Admin only)' })
    @ApiResponse({ status: 204, description: 'Review deleted successfully' })
    @ApiResponse({ status: 403, description: 'You can only delete your own reviews' })
    remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        return this.reviewsService.remove(id, user);
    }

    @Post(':id/vendor-response')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add vendor response to review (Vendor only)' })
    @ApiResponse({ status: 200, description: 'Vendor response added successfully' })
    @ApiResponse({ status: 403, description: 'Only the business owner can respond' })
    addVendorResponse(
        @Param('id', ParseUuidPipe) id: string,
        @Body() vendorResponseDto: VendorResponseDto,
        @CurrentUser() user: User,
    ) {
        return this.reviewsService.addVendorResponse(id, vendorResponseDto, user);
    }

    @Post(':id/response')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Respond to a review (Unified endpoint)' })
    @ApiResponse({ status: 200, description: 'Response added successfully' })
    respond(
        @Param('id', ParseUuidPipe) id: string,
        @Body() vendorResponseDto: VendorResponseDto,
        @CurrentUser() user: User,
    ) {
        return this.reviewsService.addVendorResponse(id, vendorResponseDto, user);
    }

    @Post(':id/helpful')
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark review as helpful' })
    @ApiResponse({ status: 204, description: 'Review marked as helpful' })
    @ApiResponse({ status: 409, description: 'Already marked as helpful' })
    markAsHelpful(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        return this.reviewsService.markAsHelpful(id, user);
    }

    @Delete(':id/helpful')
    @Roles(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove helpful mark from review' })
    @ApiResponse({ status: 204, description: 'Helpful mark removed' })
    removeHelpfulMark(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        return this.reviewsService.removeHelpfulMark(id, user);
    }


    // Admin Endpoints
    @Get('admin/all')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all reviews (Admin only)' })
    @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
    findAllForAdmin(@Query() query: any) {
        return this.reviewsService.findAllForAdmin(query);
    }

    @Patch('admin/:id/moderate')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Moderate review (Admin only)' })
    @ApiResponse({ status: 200, description: 'Review moderated successfully' })
    moderate(
        @Param('id', ParseUuidPipe) id: string,
        @Body() moderationDto: { isApproved?: boolean; isSuspicious?: boolean },
    ) {
        return this.reviewsService.moderate(id, moderationDto);
    }

    @Delete(':id/response')
    @Roles(UserRole.VENDOR, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete vendor response' })
    @ApiResponse({ status: 204, description: 'Vendor response deleted successfully' })
    removeResponse(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
        return this.reviewsService.addVendorResponse(id, { response: null }, user);
    }
}
